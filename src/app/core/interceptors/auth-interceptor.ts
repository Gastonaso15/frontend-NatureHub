import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('nh_token');

  const peticion = token
    ? req.clone({ setHeaders: { 'X-Auth-Token': token } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('nh_token');
        localStorage.removeItem('nh_user');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};