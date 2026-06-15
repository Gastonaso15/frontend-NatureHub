import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AutenticacionService } from '../../../core/services/autenticacion';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class SidebarComponent {
  authService = inject(AutenticacionService);

  esModerador = computed(() => {
    const rol = this.authService.currentUser()?.rol;
    return rol === 'MODERADOR' || rol === 'ADMINISTRADOR';
  });

  esAdministrador = computed(() => this.authService.currentUser()?.rol === 'ADMINISTRADOR');
}