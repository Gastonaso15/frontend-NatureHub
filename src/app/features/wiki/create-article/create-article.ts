import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AuthService } from '../../../core/services/auth';
import { CustomFieldType } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-article.html',
  styleUrl: './create-article.scss'
})
export class CreateArticleComponent {
  private wikiService = inject(WikiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  sections = this.wikiService.getSections();
  submitted = false;
  loading = false;

  articleData = {
    titulo: '',
    foto_url: '',
    nombre_cientifico: '',
    areas_habitat: '',
    dieta: '',
    horas_activas: '',
    id_seccion: 1
  };

  extraFields: { etiqueta: string; valor: string; tipo: CustomFieldType }[] = [];

  fieldTypes: { value: CustomFieldType; label: string }[] = [
    { value: 'texto', label: 'Texto' },
    { value: 'numerico', label: 'Numérico' },
    { value: 'booleano', label: 'Sí/No' },
    { value: 'fecha', label: 'Fecha' }
  ];

  addExtraField(): void {
    this.extraFields.push({ etiqueta: '', valor: '', tipo: 'texto' });
  }

  removeExtraField(index: number): void {
    this.extraFields.splice(index, 1);
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.submitted = true;
    if (form.invalid) return;

    const user = this.authService.currentUser();
    if (!user) {
      await Swal.fire({
        title: 'Sesión requerida',
        text: 'Iniciá sesión nuevamente para crear un artículo.',
        icon: 'warning',
        confirmButtonColor: '#2d6a4f'
      });
      this.router.navigate(['/auth/login']);
      return;
    }

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

    this.loading = true;

    this.wikiService
      .addPublication({
        ...this.articleData,
        id_seccion: Number(this.articleData.id_seccion),
        id_autor: user.id_usuario,
        campos_extras: this.extraFields.filter(field => field.etiqueta.trim())
      })
      .subscribe(async success => {
        this.loading = false;
        if (success) {
          await Swal.fire({
            title: '¡Artículo enviado!',
            text: 'Tu artículo fue enviado y está pendiente de revisión.',
            icon: 'success',
            confirmButtonColor: '#2d6a4f'
          });
          this.router.navigate(['/']);
        } else {
          await Swal.fire({
            title: 'Error',
            text: this.wikiService.lastError() ?? 'No se pudo enviar el artículo.',
            icon: 'error',
            confirmButtonColor: '#2d6a4f'
          });
        }
      });
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
