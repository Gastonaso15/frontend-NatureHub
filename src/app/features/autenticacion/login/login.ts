import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AutenticacionService } from '../../../core/services/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  loginData = { email: '', password: '' };
  submitted = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AutenticacionService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onLogin(form: NgForm): void {
    this.submitted = true;
    this.errorMessage = null;
    if (form.invalid) return;

    this.authService.login(
        this.loginData.email, 
        this.loginData.password
    ).subscribe({
        next: (response) => {
            localStorage.setItem('nh_token', response.token);
            localStorage.setItem('nh_user', JSON.stringify({
                id_usuario: response.idusuario,
                nombre:     response.nombre,
                apellido:   response.apellido,
                email:      response.email,
                rol:        response.rol,
                activo:     true
            }));
            this.authService.currentUser.set({
                id_usuario: response.id,
                nombre:     response.nombre,
                apellido:   response.apellido,
                email:      response.email,
                rol:        response.rol,
                activo:     true,
                sexo:       response.sexo || null,
                fechaRegistro: response.fechaRegistro || null,
                fechaNacimiento: response.fechaNacimiento || null,
                pais:       response.pais || null,
                bio:        response.bio || null,
                fotoUrl:    response.fotoUrl || null
            });
            this.router.navigate(['/']);
        },
        error: (err: unknown) => {
            const e = err as { error?: { error?: string; message?: string }; message?: string };
            const msg = e?.error?.error ?? e?.error?.message ?? e?.message;
            
            this.errorMessage = typeof msg === 'string' && msg.length ? msg : 'Correo electrónico o contraseña incorrectos.';

            this.cdr.detectChanges();
        }
    });
  }
}