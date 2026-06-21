import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  private router = inject(Router);

  constructor(public authService: AutenticacionService) {}

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}