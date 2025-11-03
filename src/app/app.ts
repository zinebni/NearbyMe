import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { combineLatest, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { UserService } from './user-service';

@Component({
  selector: 'app-root',
  imports: [ ReactiveFormsModule, FormsModule, HttpClientModule, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  username = new FormControl('');             // input username
  maxDistanceControl = new FormControl(5000); // distance filter
  users$: Observable<any[]> = of([]);
  filteredUsers$: Observable<any[]> = of([]);
  currentUser: any = null;
  userNotFound = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    // load once
    this.users$ = this.userService.getUsers().pipe(
      tap(users => console.log('📦 Total users loaded:', users.length))
    );

    // normalized username stream (trim + toLowerCase)
    const usernameNormalized$ = this.username.valueChanges.pipe(
      startWith(this.username.value ?? ''),
      debounceTime(300),
      map(v => (v ?? '').toString().trim().toLowerCase()),
      distinctUntilChanged()
    );

    // combine users + normalized username + maxDistance
    this.filteredUsers$ = combineLatest([
      this.users$, // ensures users are loaded before searching
      usernameNormalized$,
      this.maxDistanceControl.valueChanges.pipe(startWith(this.maxDistanceControl.value ?? 5000))
    ]).pipe(
      // compute results in a pure map (no side-effect until we know result)
      map(([users, username, maxDistance]) => {
        // empty input -> clear result
        if (!username) {
          this.userNotFound = false;
          return [];
        }

        console.log('🔍 searching for:', username);

        // find matching user by normalized username
        const found = users.find(u => (u.login?.username ?? '').toString().toLowerCase() === username);

        if (!found) {
          console.log('❌ user not found for:', username);
          // set flags so template can show message
          this.userNotFound = true;
          // clear currentUser only when we know there's no match
          this.currentUser = null;
          return [];
        }

        // found user: compute distances and results
        this.userNotFound = false;
        // update currentUser only when different (prevents unnecessary DOM churn)
        if (!this.currentUser || this.currentUser.login.username !== found.login.username) {
          this.currentUser = found;
        }

        const userLat = parseFloat(found.location.coordinates.latitude);
        const userLon = parseFloat(found.location.coordinates.longitude);

        const sameCountry = users
          .filter(u => (u.location?.country ?? '') === (found.location?.country ?? '') && u.login.username !== found.login.username)
          .map(u => {
            const lat = parseFloat(u.location.coordinates.latitude);
            const lon = parseFloat(u.location.coordinates.longitude);
            const distance = this.calculateDistance(userLat, userLon, lat, lon);
            return { ...u, distance };
          })
          .filter(u => u.distance <= (Number(maxDistance) || 0))
          .sort((a, b) => a.distance - b.distance);

        console.log(`✅ found ${sameCountry.length} matches within ${maxDistance} km`);
        return sameCountry;
      })
    );
  }

  // Haversine
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
