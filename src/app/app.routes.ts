import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home/home';
import { autenticacionGuard } from './core/guards/autenticacion-guard';
import { administradorGuard } from './core/guards/administrador-guard';
import { moderadorGuard } from './core/guards/moderador-guard';

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
    path: 'categorias',
    loadComponent: () => import('./features/wiki/lista-publicaciones/lista-publicaciones').then(m => m.ListaPublicacionesComponent)
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
    path: 'wiki/mis-publicaciones',
    canActivate: [autenticacionGuard],
    loadComponent: () => import('./features/wiki/mis-publicaciones/mis-publicaciones').then(m => m.MisPublicacionesComponent)
  },
  {
    path: 'wiki/editar/:id',
    canActivate: [autenticacionGuard],
    loadComponent: () => import('./features/wiki/modificar-publicacion/modificar-publicacion').then(m => m.ModificarPublicacionComponent)
  },
  {
    path: 'perfil',
    canActivate: [autenticacionGuard],
    loadComponent: () => import('./features/perfil/perfil/perfil').then(m => m.PerfilComponent)
  },
  {
    path: 'perfil/:id',
    loadComponent: () => import('./features/perfil/perfil-usuario/perfil-usuario').then(m => m.PerfilUsuarioComponent)
  },
  {
    path: 'moderacion/publicaciones',
    canActivate: [autenticacionGuard, moderadorGuard],
    loadComponent: () => import('./features/moderacion/moderar-publicaciones/moderar-publicaciones').then(m => m.ModerarPublicacionesComponent)
  },
  {
    path: 'admin/promover-usuario',
    canActivate: [autenticacionGuard, administradorGuard],
    loadComponent: () => import('./features/administrador/promover-usuario/promover-usuario').then(m => m.PromoverUsuarioComponent)
  },
  {
    path: 'admin/degradar-moderador',
    canActivate: [autenticacionGuard, administradorGuard],
    loadComponent: () => import('./features/administrador/degradar-moderador/degradar-moderador').then(m => m.DegradarModeradorComponent)
  },
  {
    path: 'admin/promover-moderador',
    canActivate: [autenticacionGuard, administradorGuard],
    loadComponent: () => import('./features/administrador/promover-moderador/promover-moderador').then(m => m.PromoverModeradorComponent)
  },
  {
    path: 'admin/degradar-administrador',
    canActivate: [autenticacionGuard, administradorGuard],
    loadComponent: () => import('./features/administrador/degradar-administrador/degradar-administrador').then(m => m.DegradarAdministradorComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];