import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../services/autenticacion';

export const moderadorGuard: CanActivateFn = () => {
  const authService = inject(AutenticacionService);
  const router = inject(Router);
  const rol = authService.currentUser()?.rol;

  if (rol === 'MODERADOR' || rol === 'ADMINISTRADOR') {
    return true;
  }

  router.navigate(['/']);
  return false;
};