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
  template: `
    <app-navbar></app-navbar>

    @if (authService.isLoggedIn()) {
      <button class="menu-toggle" (click)="toggleSidebar()">
        ☰
      </button>
    }

    <div class="app-layout">
      @if (authService.isLoggedIn()) {
        <app-sidebar [class.abierto]="sidebarAbierta()"></app-sidebar>
      }
      
      @if (authService.isLoggedIn() && sidebarAbierta()) {
        <div class="sidebar-overlay" (click)="toggleSidebar()"></div>
      }

      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
    }

    .app-layout {
      display: flex;
      flex: 1;
      position: relative;
    }

    .app-content {
      flex: 1;
      min-width: 0;
      padding: 20px;
      transition: margin-left 0.3s ease;
    }

    .menu-toggle {
      position: fixed;
      top: 15px;
      left: 15px;
      z-index: 1100;
      background: #2e7d32;
      color: white;
      border: none;
      padding: 8px 12px;
      font-size: 20px;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    app-navbar {
      width: 100%;
    }

    .sidebar-overlay {
      display: none;
    }

    @media (max-width: 768px) {
      .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.4);
        z-index: 999;
      }
    }
  `]
})
export class App {
  authService = inject(AutenticacionService);
  sidebarAbierta = signal(false);

  toggleSidebar() {
    this.sidebarAbierta.update(val => !val);
  }
}