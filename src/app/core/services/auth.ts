import { Injectable, signal, inject } from '@angular/core';
import { User } from '../../shared/models/wiki.models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';
  
  currentUser = signal<User | null>(this.loadFromStorage());

  private loadFromStorage(): User | null {
    const saved = localStorage.getItem('nh_user');
    return saved ? JSON.parse(saved) : null;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/iniciarSesion`, {email, password});
  }

  logout(): void {
    const token = localStorage.getItem('nh_token');
    if (token) {
        this.http.post(`${this.apiUrl}/usuarios/cerrarSesion`, { token }).subscribe();
    }
    this.currentUser.set(null);
    localStorage.removeItem('nh_user');
    localStorage.removeItem('nh_token');
  }


  register(nombre: string, apellido: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/altaUsuario`, {nombre, apellido, email, password});
  }

}
