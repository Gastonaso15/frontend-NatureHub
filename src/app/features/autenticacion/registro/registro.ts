import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AutenticacionService } from '../../../core/services/autenticacion';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class RegistroComponent {
  registrarInformacion = {
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

  constructor(private authService: AutenticacionService, private router: Router) { }

  checkPasswordMatch(): void {
    if (this.registrarInformacion.confirmPassword.length > 0) {
      this.passwordMismatch = this.registrarInformacion.password !== this.registrarInformacion.confirmPassword;
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
    this.registrarInformacion.fotoUrl = '';
  }

  removePhoto(): void {
    if (this.photoPreview) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoPreview = null;
    this.photoFile = undefined;
  }

  onFotoUrlChange(): void {
    if (this.registrarInformacion.fotoUrl) {
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

    this.authService.registrar(
      this.registrarInformacion.nombre,
      this.registrarInformacion.apellido,
      this.registrarInformacion.email,
      this.registrarInformacion.password,
      this.registrarInformacion.sexo || undefined,
      this.registrarInformacion.fechaNacimiento || undefined,
      this.registrarInformacion.pais || undefined,
      this.registrarInformacion.bio || undefined,
      this.registrarInformacion.fotoUrl || undefined,
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