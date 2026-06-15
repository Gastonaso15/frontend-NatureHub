import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { AutenticacionService } from '../../../core/services/autenticacion';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, UpperCasePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  constructor(public authService: AutenticacionService) {}

  cerrarSesion(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}