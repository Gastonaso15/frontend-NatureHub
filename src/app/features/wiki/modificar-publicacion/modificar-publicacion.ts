import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { TipoCampoPersonalizado, Publicacion } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-modificar-publicacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modificar-publicacion.html',
  styleUrl: './modificar-publicacion.scss',
})
export class ModificarPublicacionComponent implements OnInit {
  private wikiService = inject(WikiService);
  private authService = inject(AutenticacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  secciones = this.wikiService.getSecciones();
  cargando = signal(true);
  error = signal<string | null>(null);
  enviado = false;
  estadoOriginal = '';
  idPublicacion = 0;

  datosArticulo = {
    titulo: '',
    foto_url: '',
    nombre_cientifico: '',
    areas_habitat: '',
    dieta: '',
    horas_activas: '',
    id_seccion: 1,
  };

  fotoFile?: File;
  fotoPreview: string | null = null;
  dragActive = false;
  camposExtras: { etiqueta: string; valor: string; tipo: TipoCampoPersonalizado }[] = [];

  tiposCampo: { value: TipoCampoPersonalizado; label: string }[] = [
    { value: 'texto', label: 'Texto' },
    { value: 'numerico', label: 'Numérico' },
    { value: 'booleano', label: 'Sí/No' },
    { value: 'fecha', label: 'Fecha' },
  ];

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Publicación no encontrada.');
      this.cargando.set(false);
      return;
    }

    this.idPublicacion = id;
    this.cargarDatos(id);
  }

  private async cargarDatos(id: number): Promise<void> {
    try {
      const [secciones, pub] = await Promise.all([
        firstValueFrom(this.wikiService.listarSeccionesApi()),
        this.wikiService.obtenerPublicacionPorIdApi(id)
      ]);

      if (secciones) {
        this.secciones = secciones;
      }

      const autorId = this.authService.currentUser()?.id_usuario;

      if (!pub || Number(pub.id_autor) !== Number(autorId)) {
        this.error.set('No se encontró la publicación o no tenés permiso para editarla.');
        this.cargando.set(false);
        this.cdr.detectChanges();
        return;
      }

      this.estadoOriginal = pub.estado;
      this.datosArticulo = {
        titulo: pub.titulo,
        foto_url: pub.foto_url,
        nombre_cientifico: pub.nombre_cientifico,
        areas_habitat: pub.areas_habitat,
        dieta: pub.dieta,
        horas_activas: pub.horas_activas,
        id_seccion: pub.id_seccion,
      };

      if (pub.foto_url) {
        this.fotoPreview = pub.foto_url;
      }

      this.camposExtras = (pub.campos_extras ?? []).map((c) => ({
        etiqueta: c.etiqueta,
        valor: c.valor,
        tipo: c.tipo,
      }));

      this.cargando.set(false);
    } catch {
      try {
        const seccionesFallback = await firstValueFrom(this.wikiService.listarSeccionesApi());
        this.secciones = seccionesFallback;
      } catch {
      }
      this.error.set('No se pudo cargar la publicación. Verificá que el servidor esté activo.');
      this.cargando.set(false);
    } finally {
      this.cdr.detectChanges();
    }
  }

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
    if (this.fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.fotoPreview);
    }
    this.fotoFile = file;
    this.fotoPreview = URL.createObjectURL(file);
    this.datosArticulo.foto_url = '';
  }

  removeFoto(): void {
    if (this.fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.fotoPreview);
    }
    this.fotoPreview = null;
    this.fotoFile = undefined;
    this.datosArticulo.foto_url = '';
  }

  onFotoUrlChange(): void {
    if (this.datosArticulo.foto_url) {
      this.fotoFile = undefined;
      if (this.fotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = this.datosArticulo.foto_url;
    }
  }

  agregarCampoExtra(): void {
    this.camposExtras.push({ etiqueta: '', valor: '', tipo: 'texto' });
  }

  eliminarCampoExtra(index: number): void {
    this.camposExtras.splice(index, 1);
  }

  private mensajeExito(estadoNuevo?: string): string {
    const eraAprobada = this.estadoOriginal === 'aprobada';
    const pasoARevision = eraAprobada || estadoNuevo === 'PENDIENTE_REVISION';

    if (pasoARevision) {
      return 'Los cambios se guardaron correctamente. La publicación volvió a estado pendiente de revisión.';
    }
    return 'Los cambios se guardaron correctamente.';
  }

  irAMisPublicaciones(): void {
    this.router.navigate(['/wiki/mis-publicaciones']);
  }

  private async volverAMisPublicaciones(titulo: string, texto: string, icon: 'success' | 'info'): Promise<void> {
    await Swal.fire({
      title: titulo,
      text: texto,
      icon,
      confirmButtonColor: '#2d6a4f',
      confirmButtonText: 'Volver a Mis publicaciones',
    });
    this.router.navigate(['/wiki/mis-publicaciones']);
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.enviado = true;
    if (form.invalid || this.imagenInvalida()) return;

    const user = this.authService.currentUser();
    const datosEnvio: Publicacion = {
      id_publicacion: this.idPublicacion,
      ...this.datosArticulo,
      id_autor: user!.id_usuario,
      estado: this.estadoOriginal as Publicacion['estado'],
      fecha_creacion: '',
      campos_extras: this.camposExtras,
    };

    try {
      const respuesta = await this.wikiService.modificarPublicacion(datosEnvio, this.fotoFile);
      await this.volverAMisPublicaciones('¡Cambios guardados!', this.mensajeExito(respuesta.estado), 'success');
    } catch (error: any) {
      let mensajeError = 'Hubo un problema al guardar los cambios. Intentá nuevamente.';

      if (error?.error?.error) {
        mensajeError = error.error.error;
      } else if (error?.message) {
        mensajeError = error.message;
      }

      await Swal.fire({
        title: 'Error',
        text: mensajeError,
        icon: 'error',
        confirmButtonColor: '#2d6a4f',
      });
    }
  }

  async onCancel(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar y descartar cambios?',
      text: 'Los cambios realizados no se guardarán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Seguir editando',
    });

    if (result.isConfirmed) {
      await this.volverAMisPublicaciones(
        'Cambios descartados',
        'No se guardó ninguna modificación en la publicación.',
        'info'
      );
    }
  }
}
