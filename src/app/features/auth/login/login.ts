import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

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

  constructor(private authService: AuthService, private router: Router) {}

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
                id_usuario: response.id,
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
                activo:     true
            });
            this.router.navigate(['/']);
        },
        error: (err) => {
            this.errorMessage = 'Correo electrónico o contraseña incorrectos.';
        }
    });
  }
}
