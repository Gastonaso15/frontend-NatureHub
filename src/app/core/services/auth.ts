import { Injectable, signal } from '@angular/core';
import { User } from '../../shared/models/wiki.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  login(email: string): boolean {
    const mockUser: User = {
      id_usuario: 1,
      nombre: 'Gastón',
      apellido: 'Pérez',
      email: email,
      rol: 'administrador', // Cambiar según la prueba de rol que quieras hacer
      activo: true
    };
    this.currentUser.set(mockUser);
    return true;
  }

  logout() {
    this.currentUser.set(null);
  }
}