import { Component, inject, computed, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UpperCasePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  authService = inject(AutenticacionService);
  private router = inject(Router);
  private wikiService = inject(WikiService);

  private _cantReportes = signal(0);
  cantReportes = this._cantReportes.asReadonly();

  esModerador = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'MODERADOR' || rol === 'ADMINISTRADOR';
  });

  esAdministrador = computed(() => this.authService.currentUser()?.rol === 'ADMINISTRADOR');

  cerrarSesion(): void {
    this.authService.logout();
    this.cerrar.emit();
    this.router.navigate(['/']);
  }

  ngOnInit(): void {
  }
}
