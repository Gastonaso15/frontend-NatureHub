import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { TipoCampoPersonalizado, Publicacion } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-publicacion.html',
  styleUrl: './crear-publicacion.scss'
})
export class CrearPublicacionComponent implements OnInit {
  private wikiService = inject(WikiService);
  private authService = inject(AutenticacionService);
  private router = inject(Router);

  secciones = this.wikiService.getSecciones();
  enviado = false;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  datosArticulo = {
    titulo: '',
    foto_url: '',
    nombre_cientifico: '',
    areas_habitat: '',
    dieta: '',
    horas_activas: '',
    id_seccion: 1
  };

  fotoFile?: File;
  fotoPreview: string | null = null;
  dragActive = false;

  camposExtras: { etiqueta: string; valor: string; tipo: TipoCampoPersonalizado }[] = [];

  tiposCampo: { value: TipoCampoPersonalizado; label: string }[] = [
    { value: 'texto', label: 'Texto' },
    { value: 'numerico', label: 'Numérico' },
    { value: 'booleano', label: 'Sí/No' },
    { value: 'fecha', label: 'Fecha' }
  ];

  imagenInvalida(): boolean {
    return this.enviado && !this.fotoFile && !this.datosArticulo.foto_url.trim();
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
    if (!file.type.startsWith('image/')) return;
    if (this.fotoPreview) URL.revokeObjectURL(this.fotoPreview);
    this.fotoFile = file;
    this.fotoPreview = URL.createObjectURL(file);
    this.datosArticulo.foto_url = '';
  }

  removeFoto(): void {
    if (this.fotoPreview) URL.revokeObjectURL(this.fotoPreview);
    this.fotoPreview = null;
    this.fotoFile = undefined;
  }

  onFotoUrlChange(): void {
    if (this.datosArticulo.foto_url) {
      this.fotoFile = undefined;
      if (this.fotoPreview) {
        URL.revokeObjectURL(this.fotoPreview);
        this.fotoPreview = null;
      }
    }
  }

  agregarCampoExtra(): void {
    this.camposExtras.push({ etiqueta: '', valor: '', tipo: 'texto' });
  }

  eliminarCampoExtra(index: number): void {
    this.camposExtras.splice(index, 1);
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.enviado = true;
    if (form.invalid || this.imagenInvalida()) return;

    const result = await Swal.fire({
      title: '¿Enviar artículo?',
      text: 'El artículo quedará pendiente de revisión por un moderador.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Seguir editando'
    });

    if (!result.isConfirmed) return;

    const user = this.authService.currentUser();
    
    try {
      const datosEnvio: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'> = {
        ...this.datosArticulo,
        id_autor: user!.id_usuario,
        campos_extras: this.camposExtras 
      };
      
      console.log('Datos a enviar:', datosEnvio);
      
      await this.wikiService.agregarPublicacion(datosEnvio, this.fotoFile);

      await Swal.fire({
        title: '¡Artículo enviado!',
        text: 'Tu artículo fue enviado y está pendiente de revisión.',
        icon: 'success',
        confirmButtonColor: '#2d6a4f'
      });

      this.router.navigate(['/']);
    } catch (error: any) {
      let mensajeError = 'Hubo un problema al enviar el artículo. Intenta nuevamente.';
      
      if (error && error.error && error.error.error) {
        mensajeError = error.error.error;
      } else if (error && error.message) {
        mensajeError = error.message;
      }

      await Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error',
        confirmButtonColor: '#2d6a4f'
      });
      console.error('Error al enviar artículo:', error);
    }
  }

  async onCancel(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar?',
      text: 'Se perderán los datos ingresados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Seguir editando'
    });

    if (result.isConfirmed) {
      this.router.navigate(['/']);
    }
  }
}