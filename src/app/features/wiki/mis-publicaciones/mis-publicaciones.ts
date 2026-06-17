import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AutenticacionService } from '../../../core/services/autenticacion';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion } from '../../../shared/models/wiki.modelos';

@Component({
    selector: 'app-mis-publicaciones',
    standalone: true,
    imports: [RouterLink, SlicePipe],
    templateUrl: './mis-publicaciones.html',
    styleUrl: './mis-publicaciones.scss',
})
export class MisPublicacionesComponent implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AutenticacionService);
    private wikiService = inject(WikiService);
    private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

    publicaciones = signal<Publicacion[]>([]);
    cargando = signal(true);
    error = signal<string | null>(null);

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        const autorId = this.authService.currentUser()?.id_usuario;
        if (!autorId) {
            this.error.set('No se pudo identificar al usuario.');
            this.cargando.set(false);
            return;
        }

        forkJoin({
            publicaciones: this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarPublicaciones`),
            borrador: this.wikiService.obtenerBorrador(autorId),
        }).subscribe({
            next: ({ publicaciones, borrador }) => {
                const mias = publicaciones
                    .filter((p) => Number(p.autor) === Number(autorId))
                    .map((p) => ({
                        id_publicacion: p.id,
                        id_seccion: p.seccion,
                        id_autor: p.autor,
                        titulo: p.titulo,
                        nombre_cientifico: p.nombreCientifico,
                        foto_url: p.foto ?? '',
                        areas_habitat: Array.isArray(p.areasHabitat)
                            ? p.areasHabitat.join(', ')
                            : (p.areasHabitat ?? ''),
                        dieta: p.dieta,
                        horas_activas: p.horasActivas,
                        estado: (p.estado ?? '').toLowerCase(),
                        fecha_creacion: p.fechaCreacion ?? '',
                        campos_extras: p.camposExtra ?? [],
                    } as Publicacion));

                if (borrador) {
                    mias.unshift(this.wikiService.borradorComoPublicacion(borrador));
                }

                mias.sort((a, b) => {
                    if (a.es_borrador) return -1;
                    if (b.es_borrador) return 1;
                    return b.fecha_creacion.localeCompare(a.fecha_creacion);
                });

                this.publicaciones.set(mias);
                this.cargando.set(false);
            },
            error: () => {
                this.error.set(
                    'No se pudieron cargar tus publicaciones. Verificá que el servidor esté activo.'
                );
                this.cargando.set(false);
            },
        });
    }

    nombreSeccion(id: number): string {
        return this.wikiService.getSeccionPorId(id)?.nombre ?? `Sección ${id}`;
    }

    etiquetaEstado(estado: string): string {
        const map: Record<string, string> = {
            aprobada: 'Aprobada',
            pendiente_revision: 'En revisión',
            rechazada: 'Rechazada',
            borrador: 'Borrador',
        };
        return map[estado] ?? estado;
    }

    trackPublicacion(pub: Publicacion): string | number {
        return pub.es_borrador ? `borrador-${pub.id_borrador}` : pub.id_publicacion;
    }
}
