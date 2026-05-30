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

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(form: NgForm): void {
    this.submitted = true;
    this.passwordMismatch = false;
    if (form.invalid) return;

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.passwordMismatch = true;
      return;
    }

    this.authService.register(
      this.registerData.nombre,
      this.registerData.apellido,
      this.registerData.email
    );
    this.router.navigate(['/']);
  }
}
