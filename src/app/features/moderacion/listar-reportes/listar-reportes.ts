import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

interface ReporteVista {
  id_reporte: number;
  id_publicacion: number;
  id_usuario: number;
  motivo: string;
  fecha: string;
  resuelto: boolean;
  tituloPub: string;
  nombreUsuario: string;
}

type Filtro = 'pendientes' | 'resueltos' | 'todos';

@Component({
  selector: 'app-listar-reportes',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './listar-reportes.html',
  styleUrl: './listar-reportes.scss',
})
export class ListarReportesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  private reportes = signal<ReporteVista[]>([]);
  filtro = signal<Filtro>('pendientes');
  cargando = signal(true);
  procesando = signal<number | null>(null);

  reportesFiltrados = computed(() => {
    const f = this.filtro();
    const lista = this.reportes();
    if (f === 'pendientes') return lista.filter(r => !r.resuelto);
    if (f === 'resueltos') return lista.filter(r => r.resuelto);
    return lista;
  });

  cantPendientes = computed(() => this.reportes().filter(r => !r.resuelto).length);

  ngOnInit(): void {
    this.cargar();
  }

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
  }

  cargar(): void {
    this.cargando.set(true);

    forkJoin({
      reportes: this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarReportes`),
      publicaciones: this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarPublicaciones`),
      usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`),
    }).subscribe({
      next: ({ reportes, publicaciones, usuarios }) => {
        const mapaPubs = new Map<number, string>(
          publicaciones.map(p => [Number(p.id), p.titulo])
        );
        const mapaUsers = new Map<number, string>(
          usuarios.map(u => [Number(u.id), `${u.nombre} ${u.apellido}`])
        );

        const vista: ReporteVista[] = reportes
          .map(r => ({
            id_reporte: Number(r.id_reporte),
            id_publicacion: Number(r.id_publicacion),
            id_usuario: Number(r.id_usuario),
            motivo: r.motivo,
            fecha: r.fecha,
            resuelto: r.resuelto === true || r.resuelto === 1 || r.resuelto === '1',
            tituloPub: mapaPubs.get(Number(r.id_publicacion)) ?? '',
            nombreUsuario: mapaUsers.get(Number(r.id_usuario)) ?? '',
          }))
          .sort((a, b) => {
            if (a.resuelto !== b.resuelto) return a.resuelto ? 1 : -1;
            return b.fecha.localeCompare(a.fecha);
          });

        this.reportes.set(vista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        Swal.fire('Error', 'No se pudieron cargar los reportes.', 'error');
      },
    });
  }

  marcarResuelto(reporte: ReporteVista): void {
    this.procesando.set(reporte.id_reporte);

    this.http.post(`${this.apiUrl}/publicaciones/resolverReporte`, {
      idReporte: reporte.id_reporte,
    }).subscribe({
      next: () => {
        this.procesando.set(null);
        this.reportes.update(lista =>
          lista.map(r =>
            r.id_reporte === reporte.id_reporte ? { ...r, resuelto: true } : r
          )
        );
      },
      error: (err) => {
        this.procesando.set(null);
        const msg = err?.error?.error ?? 'No se pudo marcar el reporte como resuelto.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }
}