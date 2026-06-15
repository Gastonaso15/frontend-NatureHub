import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AuthService } from '../../../core/services/auth';
import { TipoCampoPersonalizado } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-articulo.html',
  styleUrl: './crear-articulo.scss'
})
export class CrearArticuloComponent {
  private wikiService = inject(WikiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  secciones = this.wikiService.getSecciones();
  enviado = false;

  datosArticulo = {
    titulo: '',
    foto_url: '',
    nombre_cientifico: '',
    areas_habitat: '',
    dieta: '',
    horas_activas: '',
    id_seccion: 1
  };

  camposExtras: { etiqueta: string; valor: string; tipo: TipoCampoPersonalizado }[] = [];

  tiposCampo: { value: TipoCampoPersonalizado; label: string }[] = [
    { value: 'texto', label: 'Texto' },
    { value: 'numerico', label: 'Numérico' },
    { value: 'booleano', label: 'Sí/No' },
    { value: 'fecha', label: 'Fecha' }
  ];

  agregarCampoExtra(): void {
    this.camposExtras.push({ etiqueta: '', valor: '', tipo: 'texto' });
  }

  eliminarCampoExtra(index: number): void {
    this.camposExtras.splice(index, 1);
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.enviado = true;
    if (form.invalid) return;

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
    this.wikiService.agregarPublicacion({
      ...this.datosArticulo,
      id_autor: user?.id_usuario ?? 0,
      campos_extras: this.camposExtras
    });

    await Swal.fire({
      title: '¡Artículo enviado!',
      text: 'Tu artículo fue enviado y está pendiente de revisión.',
      icon: 'success',
      confirmButtonColor: '#2d6a4f'
    });

    this.router.navigate(['/']);
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
