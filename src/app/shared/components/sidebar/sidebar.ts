import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AutenticacionService } from '../../../core/services/autenticacion';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  private authService = inject(AutenticacionService);
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  private _cantReportes = signal(0);
  cantReportes = this._cantReportes.asReadonly();

  esModerador = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'MODERADOR' || rol === 'ADMINISTRADOR';
  });

  esAdministrador = computed(() => this.authService.currentUser()?.rol === 'ADMINISTRADOR');

  ngOnInit(): void {
    if (this.esModerador()) {
      this.cargarContadorReportes();
    }
  }

  private cargarContadorReportes(): void {
    this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarReportes`).subscribe({
      next: (reportes) => {
        const pendientes = reportes.filter(r => !r.resuelto && r.resuelto !== 1 && r.resuelto !== '1').length;
        this._cantReportes.set(pendientes);
      },
      error: () => {}
    });
  }
}