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

    const success = this.authService.login(this.loginData.email, this.loginData.password);
    if (success) {
      this.router.navigate(['/']);
    } else {
      this.errorMessage = 'Correo electrónico o contraseña incorrectos.';
    }
  }
}
