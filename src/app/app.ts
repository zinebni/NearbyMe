// ReactiveFormsModule  importé pour utiliser les formulaires réactifs dans Angular il permet de créer et gérer des formulaires de manière programmatique telle que les FormControl et FormGroup.
// RxJS est une bibliothèque JavaScript qui fournit des outils pour la programmation réactive en utilisant des observables.
// observable est un objet qui émet des valeurs ou des événements au fil du temps.
// of est une fonction utilitaire de RxJS qui crée un observable à partir d'une liste de valeurs.
// debounceTime est un opérateur RxJS qui ignore les émissions d'un observable pendant un certain délai.
// distinctUntilChanged est un opérateur RxJS qui ignore les émissions d'un observable si la valeur est identique à la dernière émission.
// startWith est un opérateur RxJS qui émet une valeur initiale avant de commencer à émettre les valeurs réelles de l'observable.
// tap est un opérateur RxJS qui permet d'exécuter des effets secondaires pour chaque émission d'un observable sans modifier les valeurs émises telque console.log ici.
// map est un opérateur RxJS qui transforme chaque émission d'un observable en une nouvelle valeur en utilisant une fonction de projection.
// combineLatest est une fonction utilitaire de RxJS qui combine les dernières émissions de plusieurs observables en un seul observable.
// Haversine est une formule mathématique utilisée pour calculer la distance entre deux points sur la surface d'une sphère en fonction de leurs latitudes et longitudes.
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
  users$: Observable<any[]> = of([]); // users$ : le $ ici indique que c'est un observable qui émet tous les utilisateurs récupérés depuis le service UserService
  filteredUsers$: Observable<any[]> = of([]); // filteredUsers$ : le $ ici indique que c'est un observable qui émet les utilisateurs filtrés en fonction de la recherche
  currentUser: any = null;               // utilisateur actuellement sélectionné
  userNotFound = false;              // indicateur si l'utilisateur recherché n'a pas été trouvé


  // constructor d'un singleton UserService : injecte le service UserService pour pouvoir l'utiliser dans ce composant.
  constructor(private userService: UserService) {}

  ngOnInit() {
    // load once
    this.users$ = this.userService.getUsers().pipe(
      //tap pour faire un effet de bord (side-effect) sans modifier la valeur émise. "side-effect : veut dire que l'on fait quelque chose sans changer la valeur" : ici on log le nombre total d'utilisateurs chargés depuis l'API.
      tap(users => console.log('📦 Total users loaded:', users.length))
    );

    // usernameNormalized$ : est un flux qu'on crée à partir de l'observable this.username.valueChanges. c est lui qu'on va utiliser pour faire la recherche d'utilisateur.
    // normalized username stream (trim + toLowerCase)
    const usernameNormalized$ = this.username.valueChanges.pipe(
      startWith(this.username.value ?? ''),//first emission with current value of the FormControl this.username or empty string if null/undefined
      debounceTime(300), //set a delay of 300ms before emitting the value
      map(v => (v ?? '').toString().trim().toLowerCase()),//normalize the username by trimming whitespace and converting to lowercase
      distinctUntilChanged() //ignore new value if same as last value
    );

    // combine users + normalized username + maxDistance pour faire la recherche
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

        console.log('searching for:', username);

        // find matching user by normalized username
        const found = users.find(u => (u.login?.username ?? '').toString().toLowerCase() === username);

        if (!found) {
          console.log(' user not found for:', username);
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
        
        //recuperer les coordonnées de l'utilisateur trouvé
        const userLat = parseFloat(found.location.coordinates.latitude);
        const userLon = parseFloat(found.location.coordinates.longitude);


        // filter users from same country within maxDistance and sort by distance
        // first find users from same country excluding the found user or the current user who is searching 
        // then map to add distance property then filter by maxDistance then sort by distance ascending
        const sameCountry = users
          .filter(u => (u.location?.country ?? '') === (found.location?.country ?? '') && u.login.username !== found.login.username)
          .map(u => {
            //recuperer les coordonnées des utilisateurs du meme pays
            const lat = parseFloat(u.location.coordinates.latitude);
            const lon = parseFloat(u.location.coordinates.longitude);
            //donner ces coordonnées à la fonction calculateDistance pour calculer la distance entre l'utilisateur trouvé et les utilisateurs du meme pays
            const distance = this.calculateDistance(userLat, userLon, lat, lon);
            //intecrer la distance calculée dans l'objet utilisateur
            return { ...u, distance };
          })
          .filter(u => u.distance <= (Number(maxDistance) || 0)) // filter by maxDistance
          .sort((a, b) => a.distance - b.distance); // sort by distance ascending

        console.log(`✅ found ${sameCountry.length} matches within ${maxDistance} km`);
        return sameCountry;
      })
    );
  }

  // Haversine
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);  //le delta de latitude en radians (delta = difference)
    const dLon = this.deg2rad(lon2 - lon1);  //le delta de longitude en radians
    // a est la formule de Haversine : (a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)) permettant de calculer la distance entre deux points sur une sphère à partir de leurs latitudes et longitudes.
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // c est la distance en radians
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // distance est la distance en km (la distance entre les deux points sur la surface de la terre = rayon de la terre * c)
    const distance = R * c;
    // arrondir la distance à une décimale pour une meilleure lisibilité
    return Math.round(distance * 10) / 10;
  }
  // convert degrees to radians : degrees * (π / 180)
  // au premier on a des valeur en degrés car on travaille avec des coordonnées géographiques,
  // et au second on a des valeurs en radians car les fonctions trigonométriques en JavaScript utilisent des radians. trigonométriques est l'étude des relations entre les angles et les côtés des triangles (cos sin tan).
  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
