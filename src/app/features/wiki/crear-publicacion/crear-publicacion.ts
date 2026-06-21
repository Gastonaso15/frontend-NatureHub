import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { TipoCampoPersonalizado, Publicacion } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-crear-publicacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-publicacion.html',
  styleUrl: './crear-publicacion.scss'
})
export class CrearPublicacionComponent implements OnInit {
  private wikiService = inject(WikiService);
  private authService = inject(AutenticacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  secciones = this.wikiService.getSecciones();
  enviado = false;
  inicializado = false;
  guardandoBorrador = false;
  borradorGuardado = signal(false);

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

  async ngOnInit(): Promise<void> {
    if (!this.authService.estaLogueado()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const autorId = this.authService.currentUser()!.id_usuario;

    try {
      const [secciones, borrador] = await Promise.all([
        firstValueFrom(this.wikiService.listarSeccionesApi()),
        this.wikiService.obtenerBorrador(autorId).catch(() => null)
      ]);

      if (secciones) {
        this.secciones = secciones;
      }

      const continuarDirecto = this.route.snapshot.queryParamMap.get('continuar') === '1';

      if (borrador && continuarDirecto) {
        this.cargarDesdeBorrador(borrador);
      } else if (borrador) {
        const result = await Swal.fire({
          title: 'Tenés un borrador guardado',
          text: borrador.titulo
            ? `¿Querés continuar con "${borrador.titulo}" o empezar uno nuevo?`
            : '¿Querés continuar con tu borrador o empezar uno nuevo?',
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonColor: '#2d6a4f',
          cancelButtonColor: '#6c757d',
          denyButtonColor: '#dc3545',
          confirmButtonText: 'Continuar borrador',
          denyButtonText: 'Empezar de cero',
          cancelButtonText: 'Volver',
        });

        if (result.isDismissed && !result.isDenied && !result.isConfirmed) {
          this.router.navigate(['/wiki/mis-publicaciones']);
          return;
        }

        if (result.isDenied) {
          await this.wikiService.eliminarBorrador(autorId);
        } else if (result.isConfirmed) {
          this.cargarDesdeBorrador(borrador);
        }
      }
    } catch {
      try {
        const seccionesFallback = await firstValueFrom(this.wikiService.listarSeccionesApi());
        this.secciones = seccionesFallback;
      } catch {
      }
    }

    this.inicializado = true;
    this.cdr.detectChanges();
  }

  private cargarDesdeBorrador(borrador: {
    titulo: string;
    nombre_cientifico: string;
    foto_url: string;
    areas_habitat: string;
    dieta: string;
    horas_activas: string;
    id_seccion: number;
    campos_extras: { etiqueta: string; valor: string; tipo: TipoCampoPersonalizado }[];
  }): void {
    this.datosArticulo = {
      titulo: borrador.titulo,
      foto_url: borrador.foto_url,
      nombre_cientifico: borrador.nombre_cientifico,
      areas_habitat: borrador.areas_habitat,
      dieta: borrador.dieta,
      horas_activas: borrador.horas_activas,
      id_seccion: borrador.id_seccion,
    };

    if (borrador.foto_url) {
      this.fotoPreview = borrador.foto_url;
    }

    this.camposExtras = borrador.campos_extras.map((c) => ({
      etiqueta: c.etiqueta,
      valor: c.valor,
      tipo: c.tipo,
    }));
  }

  imagenInvalida(): boolean {
    return this.enviado && !this.fotoFile && !this.datosArticulo.foto_url.trim();
  }

  onCampoBlur(): void {
    if (!this.inicializado || this.guardandoBorrador) return;
    this.guardarBorradorAutomatico();
  }

  private async guardarBorradorAutomatico(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    const tieneContenido =
      this.datosArticulo.titulo.trim() ||
      this.datosArticulo.nombre_cientifico.trim() ||
      this.datosArticulo.areas_habitat.trim() ||
      this.datosArticulo.dieta.trim() ||
      this.datosArticulo.horas_activas.trim() ||
      this.datosArticulo.foto_url.trim() ||
      this.fotoFile ||
      this.camposExtras.length > 0;

    if (!tieneContenido) return;

    this.guardandoBorrador = true;

    try {
      const datos: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'> = {
        ...this.datosArticulo,
        id_autor: user.id_usuario,
        campos_extras: this.camposExtras,
      };

      await this.wikiService.guardarBorrador(datos, this.fotoFile);
      this.borradorGuardado.set(true);
      setTimeout(() => this.borradorGuardado.set(false), 2000);
    } catch (error) {
      console.error('Error al guardar borrador:', error);
    } finally {
      this.guardandoBorrador = false;
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
    if (!file.type.startsWith('image/')) return;
    if (this.fotoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fotoPreview);
    this.fotoFile = file;
    this.fotoPreview = URL.createObjectURL(file);
    this.datosArticulo.foto_url = '';
    this.onCampoBlur();
  }

  removeFoto(): void {
    if (this.fotoPreview?.startsWith('blob:')) URL.revokeObjectURL(this.fotoPreview);
    this.fotoPreview = null;
    this.fotoFile = undefined;
    this.datosArticulo.foto_url = '';
    this.onCampoBlur();
  }

  onFotoUrlChange(): void {
    if (this.datosArticulo.foto_url) {
      this.fotoFile = undefined;
      if (this.fotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(this.fotoPreview);
      }
      this.fotoPreview = this.datosArticulo.foto_url;
    }
    this.onCampoBlur();
  }

  agregarCampoExtra(): void {
    this.camposExtras.push({ etiqueta: '', valor: '', tipo: 'texto' });
    this.onCampoBlur();
  }

  eliminarCampoExtra(index: number): void {
    this.camposExtras.splice(index, 1);
    this.onCampoBlur();
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

      await this.wikiService.agregarPublicacion(datosEnvio, this.fotoFile);

      await Swal.fire({
        title: '¡Artículo enviado!',
        text: 'Tu artículo fue enviado y está pendiente de revisión.',
        icon: 'success',
        confirmButtonColor: '#2d6a4f'
      });

      this.router.navigate(['/wiki/mis-publicaciones']);
    } catch (error: any) {
      let mensajeError = 'Hubo un problema al enviar el artículo. Intenta nuevamente.';

      if (error?.error?.error) {
        mensajeError = error.error.error;
      } else if (error?.message) {
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
      text: 'Tu borrador quedará guardado y podrás continuarlo más tarde.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Seguir editando'
    });

    if (result.isConfirmed) {
      await this.guardarBorradorAutomatico();
      this.router.navigate(['/wiki/mis-publicaciones']);
    }
  }
}
