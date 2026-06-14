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
  loading = false;
  passwordMismatch = false;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(form: NgForm): void {
    this.submitted = true;
    this.passwordMismatch = false;
    this.errorMessage = null;
    if (form.invalid) return;

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.loading = true;
    this.authService
      .register(
        this.registerData.nombre,
        this.registerData.apellido,
        this.registerData.email,
        this.registerData.password
      )
      .subscribe(success => {
        this.loading = false;
        if (success) {
          this.router.navigate(['/auth/login']);
        } else {
          this.errorMessage = this.authService.lastError() ?? 'No se pudo registrar el usuario. El correo podría estar en uso.';
        }
      });
  }
}
