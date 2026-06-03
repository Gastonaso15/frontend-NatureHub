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

  login(email: string, password: string): boolean {
    const mockUsers: User[] = [
      { id_usuario: 1, nombre: 'Gastón', apellido: 'Pérez', email: 'admin@naturehub.com', rol: 'administrador', activo: true },
      { id_usuario: 2, nombre: 'Luca', apellido: 'Crespi', email: 'moderador@naturehub.com', rol: 'moderador', activo: true },
      { id_usuario: 3, nombre: 'Martín', apellido: 'Marrero', email: 'usuario@naturehub.com', rol: 'usuario', activo: true },
    ];

    const found = mockUsers.find(u => u.email === email);
    if (found && password.length >= 6) {
      this.currentUser.set(found);
      localStorage.setItem('nh_user', JSON.stringify(found));
      return true;
    }
    return false;
  }

  register(nombre: string, apellido: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/altaUsuario`, {
        nombre,
        apellido,
        email,
        password
    });
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('nh_user');
  }
}
