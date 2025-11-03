import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'https://randomuser.me/api/?results=100&seed=fixed-seed'; // récupérer 100 users aléatoires mais fixés par le seed

  constructor(private http: HttpClient) {}

  //getUsers est une méthode qui retourne un Observable rjx qui contient la réponse de l'api randomuser.me
  getUsers(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(map(res => res.results));
  }
}
