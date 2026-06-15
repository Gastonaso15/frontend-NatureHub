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
  registerData = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    sexo: '',
    fechaNacimiento: '',
    pais: '',
    bio: '',
    fotoUrl: ''
  };
  photoFile?: File;
  photoPreview: string | null = null;
  dragActive = false;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFile(input.files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(): void {
    this.dragActive = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    this.handleFile(event.dataTransfer?.files?.[0]);
  }

  handleFile(file?: File): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Solo se permiten imágenes en formato JPG, PNG, GIF o WEBP.';
      return;
    }

    this.errorMessage = null;
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoFile = file;
    this.photoPreview = URL.createObjectURL(file);
    this.registerData.fotoUrl = '';
  }

  removePhoto(): void {
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoPreview = null;
    this.photoFile = undefined;
  }

  onFotoUrlChange(): void {
    if (this.registerData.fotoUrl) {
      this.photoFile = undefined;
      if (this.photoPreview) {
        URL.revokeObjectURL(this.photoPreview);
        this.photoPreview = null;
      }
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
      this.registerData.password,
      this.registerData.sexo || undefined,
      this.registerData.fechaNacimiento || undefined,
      this.registerData.pais || undefined,
      this.registerData.bio || undefined,
      this.registerData.fotoUrl || undefined,
      this.photoFile
    ).subscribe({
      next: (response) => {
        console.log('Usuario creado:', response);
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Error al registrar:', err);
        const backendMessage = err?.error?.error ?? err?.error?.message ?? err?.error ?? err?.message;
        this.errorMessage = typeof backendMessage === 'string' && backendMessage.length > 0
          ? backendMessage
          : 'No se pudo crear la cuenta. Intentá de nuevo.';
      }
    });
  }
}