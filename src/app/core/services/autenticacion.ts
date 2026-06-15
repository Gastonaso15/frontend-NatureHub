import { Injectable, signal, inject } from '@angular/core';
import { Usuario } from '../../shared/models/wiki.models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';
  
  currentUser = signal<Usuario | null>(this.loadFromStorage());

  private loadFromStorage(): Usuario | null {
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


  register(nombre: string, apellido: string, email: string, password: string, sexo?: string, fechaNacimiento?: string, pais?: string, bio?: string, fotoUrl?: string, fotoFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('apellido', apellido);
    formData.append('email', email);
    formData.append('password', password);
    if (sexo) formData.append('sexo', sexo);
    if (fechaNacimiento) formData.append('fechaNacimiento', fechaNacimiento);
    if (pais) formData.append('pais', pais);
    if (bio) formData.append('bio', bio);
    if (fotoUrl) formData.append('fotoUrl', fotoUrl);
    if (fotoFile) formData.append('foto', fotoFile, fotoFile.name);

    return this.http.post(`${this.apiUrl}/usuarios/altaUsuario`, formData);
  }

  promoverUsuario(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/promoverUsuario`, { id });
  }

  degradarModerador(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/degradarModerador`, { id });
  }

  promoverModerador(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/promoverModerador`, { id });
  }

  degradarAdministrador(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/degradarAdministrador`, { id });
  }

  listarUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/listarUsuarios`);
  }


}
