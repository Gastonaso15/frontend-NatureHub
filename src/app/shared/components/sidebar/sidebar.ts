import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  private authService = inject(AutenticacionService);
  private wikiService = inject(WikiService);

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
    this.wikiService.listarReportesApi().subscribe({
      next: (reportes) => {
        const pendientes = reportes.filter(r => r.resuelto !== true && r.resuelto !== 1 && r.resuelto !== '1').length;
        this._cantReportes.set(pendientes);
      },
      error: () => { }
    });
  }
}