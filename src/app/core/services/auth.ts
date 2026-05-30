import { Injectable, signal } from '@angular/core';
import { User } from '../../shared/models/wiki.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
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

  register(nombre: string, apellido: string, email: string): User {
    const newUser: User = {
      id_usuario: Date.now(),
      nombre,
      apellido,
      email,
      rol: 'usuario',
      activo: true
    };
    this.currentUser.set(newUser);
    localStorage.setItem('nh_user', JSON.stringify(newUser));
    return newUser;
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('nh_user');
  }
}
