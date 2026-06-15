import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion';

export const administradorGuard: CanActivateFn = () => {
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  if (authService.currentUser()?.rol === 'ADMINISTRADOR') {
    return true;
  }

  router.navigate(['/']);
  return false;
};