import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { AutenticacionService } from './core/services/autenticacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(AutenticacionService);
  sidebarAbierta = signal(false);

  toggleSidebar() {
    this.sidebarAbierta.update(val => !val);
  }
}