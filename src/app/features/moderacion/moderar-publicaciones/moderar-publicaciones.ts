import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';
import { PublicacionPendiente, Seccion, Usuario } from '../../../shared/models/wiki.modelos';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-moderar-publicaciones',
  standalone: true,
  imports: [SlicePipe, RouterLink],
  templateUrl: './moderar-publicaciones.html',
  styleUrl: './moderar-publicaciones.scss',
})
export class ModerarPublicacionesComponent implements OnInit {
  private authService = inject(AutenticacionService);
  private wikiService = inject(WikiService);

  publicaciones = signal<PublicacionPendiente[]>([]);
  cargando = signal(true);
  procesando = signal<number | null>(null);
  accionActual = signal<'APROBADA' | 'RECHAZADA' | null>(null);

  private secciones: Seccion[] = [];

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando.set(true);

    forkJoin({
      publicaciones: this.wikiService.listarPublicacionesPendientesApi(),
      usuarios: this.authService.listarUsuarios(),
      secciones: this.wikiService.listarSeccionesApi(),
    }).subscribe({
      next: ({ publicaciones, usuarios, secciones }) => {
        this.secciones = secciones;

        const usuariosMapeados = usuarios.map(AutenticacionService.mapUsuario);
        const mapaUsuarios = new Map<number, string>(
          usuariosMapeados.map((u: Usuario) => [Number(u.id_usuario), `${u.nombre} ${u.apellido}`])
        );

        this.publicaciones.set(
          publicaciones.map((p: any) => ({
            id: p.id,
            titulo: p.titulo,
            foto: p.foto ?? null,
            nombreCientifico: p.nombreCientifico,
            areasHabitat: Array.isArray(p.areasHabitat)
              ? p.areasHabitat.join(', ')
              : (p.areasHabitat ?? ''),
            dieta: p.dieta,
            horasActivas: p.horasActivas,
            estado: p.estado,
            fechaCreacion: p.fechaCreacion ?? '',
            autorId: p.autor,
            autorNombre: mapaUsuarios.get(Number(p.autor)) ?? `Usuario #${p.autor}`,
            seccion: p.seccion,
            seccionNombre: this.getNombreSeccion(p.seccion),
            camposExtra: Array.isArray(p.camposExtra) ? p.camposExtra : [],
          }))
        );
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar las publicaciones pendientes.', 'error');
      },
    });
  }

  private getNombreSeccion(idSeccion: number): string {
    const seccion = this.secciones.find(s => Number(s.id_seccion) === Number(idSeccion));
    return seccion?.nombre ?? `Sección ${idSeccion}`;
  }

  aprobar(pub: PublicacionPendiente): void {
    Swal.fire({
      title: `¿Aprobar "${pub.titulo}"?`,
      text: 'La publicación quedará visible para todos los usuarios.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2d6a4f',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.moderar(pub.id, 'APROBADA', null);
    });
  }

  rechazar(pub: PublicacionPendiente): void {
    Swal.fire({
      title: `Rechazar "${pub.titulo}"`,
      input: 'textarea',
      inputLabel: 'Motivo del rechazo (opcional)',
      inputPlaceholder: 'Explicá brevemente por qué se rechaza...',
      inputAttributes: { 'aria-label': 'Motivo del rechazo' },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const motivo = (result.value as string)?.trim() || null;
      this.moderar(pub.id, 'RECHAZADA', motivo);
    });
  }

  private moderar(
    idPublicacion: number,
    resultado: 'APROBADA' | 'RECHAZADA',
    motivoRechazo: string | null
  ): void {
    const moderador = this.authService.currentUser()?.id_usuario;
    if (!moderador) {
      Swal.fire('Error', 'No se pudo identificar al moderador.', 'error');
      return;
    }

    this.procesando.set(idPublicacion);
    this.accionActual.set(resultado);

    this.wikiService.moderarPublicacionApi(idPublicacion, moderador, resultado, motivoRechazo)
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.accionActual.set(null);

          const icon = resultado === 'APROBADA' ? 'success' : 'info';
          const text =
            resultado === 'APROBADA'
              ? 'La publicación fue aprobada y ya es visible.'
              : 'La publicación fue rechazada.';

          Swal.fire({ title: '¡Listo!', text, icon, confirmButtonColor: '#2d6a4f' });

          this.publicaciones.update((list) =>
            list.filter((p) => p.id !== idPublicacion)
          );
        },
        error: (err) => {
          this.procesando.set(null);
          this.accionActual.set(null);
          const msg =
            err?.error?.error ?? err?.error?.mensaje ?? 'No se pudo procesar la moderación.';
          Swal.fire('Error', msg, 'error');
        },
      });
  }
}