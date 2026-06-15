import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home/home';
import { autenticacionGuard } from './core/guards/autenticacion-guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/autenticacion/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/autenticacion/registro/registro').then(m => m.RegistroComponent)
  },
  {
    path: 'wiki/article/:id',
    loadComponent: () => import('./features/wiki/detalle-publicacion/detalle-publicacion').then(m => m.DetallePublicacionComponent)
  },
  {
    path: 'wiki/nuevo',
    canActivate: [autenticacionGuard],
    loadComponent: () => import('./features/wiki/crear-publicacion/crear-publicacion').then(m => m.CrearPublicacionComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
