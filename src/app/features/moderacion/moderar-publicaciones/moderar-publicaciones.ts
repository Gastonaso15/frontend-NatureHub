import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { PublicacionPendiente } from '../../../shared/models/wiki.modelos';
import Swal from 'sweetalert2';

const SECCIONES: Record<number, string> = {
  1: 'Mamíferos',
  2: 'Aves',
  3: 'Reptiles',
};

@Component({
  selector: 'app-moderar-publicaciones',
  standalone: true,
  imports: [SlicePipe, RouterLink],
  templateUrl: './moderar-publicaciones.html',
  styleUrl: './moderar-publicaciones.scss',
})
export class ModerarPublicacionesComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AutenticacionService);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  publicaciones = signal<PublicacionPendiente[]>([]);
  cargando = signal(true);
  procesando = signal<number | null>(null);
  accionActual = signal<'APROBADA' | 'RECHAZADA' | null>(null);

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando.set(true);

    forkJoin({
      publicaciones: this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarPublicacionesPendientes`),
      usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`),
    }).subscribe({
      next: ({ publicaciones, usuarios }) => {
        const mapaUsuarios = new Map<number, string>(
          usuarios.map((u) => [u.id, `${u.nombre} ${u.apellido}`])
        );

        this.publicaciones.set(
          publicaciones.map((p) => ({
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
            autorNombre: mapaUsuarios.get(p.autor) ?? `Usuario #${p.autor}`,
            seccion: p.seccion,
            seccionNombre: SECCIONES[p.seccion] ?? `Sección ${p.seccion}`,
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

    const body: Record<string, unknown> = {
      idPublicacion,
      idModerador: moderador,
      resultado,
    };
    if (motivoRechazo) {
      body['motivoRechazo'] = motivoRechazo;
    }

    this.http
      .post(`${this.apiUrl}/publicaciones/moderarPublicacion`, body)
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