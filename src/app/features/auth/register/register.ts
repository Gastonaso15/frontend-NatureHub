import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  registerData = { nombre: '', apellido: '', email: '', password: '', confirmPassword: '' };
  submitted = false;
  passwordMismatch = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  checkPasswordMatch(): void {
    if (this.registerData.confirmPassword.length > 0) {
      this.passwordMismatch = this.registerData.password !== this.registerData.confirmPassword;
    } else {
      this.passwordMismatch = false;
    }
  }

  onRegister(form: NgForm): void {
    this.submitted = true;
    this.checkPasswordMatch();

    if (form.invalid || this.passwordMismatch) return;

    this.authService.register(
      this.registerData.nombre,
      this.registerData.apellido,
      this.registerData.email,
      this.registerData.password
    ).subscribe({
      next: (response) => {
        console.log('Usuario creado:', response);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        this.errorMessage = 'No se pudo crear la cuenta. Intentá de nuevo.';
      }
    });
  }
}