import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { SlicePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { WikiService } from '../../../core/services/wiki';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { Publicacion, Seccion, Usuario } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.scss'
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private wikiService = inject(WikiService);
  private location = inject(Location);
  private authService = inject(AutenticacionService);

  articulo = signal<Publicacion | null>(null);
  seccion = signal<Seccion | null>(null);
  autor = signal<Usuario | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  procesando = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos(id);
  }

  puedeEliminar(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (user.rol === 'ADMINISTRADOR') return true;
    return user.id_usuario === this.articulo()?.id_autor;
  }

  puedeReportar(): boolean {
    const user = this.authService.currentUser();
    if (user && user.id_usuario === this.articulo()?.id_autor) return false;
    return true;
  }

  puedeModificar(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return user.id_usuario === this.articulo()?.id_autor;
  }

  modificarPublicacion(): void {
    const pub = this.articulo();
    if (!pub) return;
    this.router.navigate(['/wiki/editar', pub.id_publicacion]);
  }

  private async cargarDatos(id: number): Promise<void> {
    try {
      const pub = await this.wikiService.obtenerPublicacionPorIdDirecto(id);

      if (!pub) {
        this.error.set('Artículo no encontrado.');
        this.cargando.set(false);
        return;
      }

      this.articulo.set(pub);

      const [secciones, autor] = await Promise.all([
        this.wikiService.listarSeccionesApi().toPromise(),
        this.wikiService.obtenerUsuarioPorId(pub.id_autor).catch(() => undefined),
      ]);

      const seccionEncontrada = (secciones ?? []).find(
        s => Number(s.id_seccion) === Number(pub.id_seccion)
      ) ?? null;
      this.seccion.set(seccionEncontrada);
      this.autor.set(autor ?? null);
    } catch {
      this.error.set('No se pudo cargar el artículo.');
    } finally {
      this.cargando.set(false);
    }
  }

  async eliminarPublicacion(): Promise<void> {
    const pub = this.articulo();
    if (!pub) return;

    const result = await Swal.fire({
      title: '¿Eliminar este artículo?',
      text: `"${pub.titulo}" dejará de estar disponible para todos los usuarios.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.procesando.set(true);
    try {
      await this.wikiService.eliminarPublicacion(pub.id_publicacion);
      await Swal.fire({
        title: 'Artículo eliminado',
        text: 'El artículo fue eliminado correctamente.',
        icon: 'success',
        confirmButtonColor: '#2d6a4f',
      });
      this.location.back();
    } catch (err: any) {
      const msg = err?.error?.error ?? 'No se pudo eliminar el artículo.';
      Swal.fire('Error', msg, 'error');
    } finally {
      this.procesando.set(false);
    }
  }

  async reportarPublicacion(): Promise<void> {
    const pub = this.articulo();
    if (!pub) return;

    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const { value: motivo, isConfirmed } = await Swal.fire({
      title: 'Reportar artículo',
      input: 'textarea',
      inputLabel: 'Motivo del reporte',
      inputPlaceholder: 'Describí brevemente por qué estás reportando este artículo...',
      inputAttributes: { 'aria-label': 'Motivo del reporte', minlength: '10' },
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Enviar reporte',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return 'Por favor describí el motivo (mínimo 5 caracteres).';
        }
        return null;
      },
    });

    if (!isConfirmed || !motivo) return;

    this.procesando.set(true);
    try {
      await this.wikiService.reportarPublicacion(pub.id_publicacion, user.id_usuario, motivo.trim());
      Swal.fire({
        title: 'Reporte enviado',
        text: 'Gracias por contribuir a mantener la calidad de NatureHub. Un moderador revisará tu reporte.',
        icon: 'success',
        confirmButtonColor: '#2d6a4f',
      });
    } catch (err: any) {
      const msg = err?.error?.error ?? 'No se pudo enviar el reporte.';
      Swal.fire('Error', msg, 'error');
    } finally {
      this.procesando.set(false);
    }
  }

  volver(): void {
    this.location.back();
  }
}