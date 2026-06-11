import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { User, UserRole } from '../../shared/models/wiki.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  currentUser = signal<User | null>(this.loadUserFromStorage());
  private tokenSignal = signal<string | null>(localStorage.getItem('nh_token'));

  constructor(private http: HttpClient) {}

  private loadUserFromStorage(): User | null {
    const saved = localStorage.getItem('nh_user');
    return saved ? JSON.parse(saved) : null;
  }

  get token(): string | null {
    return this.tokenSignal();
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<any>(`${this.api}/usuarios/iniciarSesion`, { email, password })
      .pipe(
        tap(res => {
          const user: User = {
            id_usuario: res.idusuario,
            nombre: res.nombre,
            apellido: res.apellido,
            email: res.email,
            rol: (res.rol as string).toLowerCase() as UserRole,
            activo: true
          };
          this.currentUser.set(user);
          this.tokenSignal.set(res.token);
          localStorage.setItem('nh_user', JSON.stringify(user));
          localStorage.setItem('nh_token', res.token);
        }),
        map(() => true),
        catchError(() => of(false))
      );
  }

  register(nombre: string, apellido: string, email: string, password: string): Observable<boolean> {
    return this.http
      .post<any>(`${this.api}/usuarios/altaUsuario`, { nombre, apellido, email, password })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  logout(): void {
    const token = this.tokenSignal();
    if (token) {
      this.http.post(`${this.api}/usuarios/cerrarSesion`, { token }).subscribe();
    }
    this.currentUser.set(null);
    this.tokenSignal.set(null);
    localStorage.removeItem('nh_user');
    localStorage.removeItem('nh_token');
  }
}
