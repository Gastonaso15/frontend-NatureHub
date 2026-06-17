import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion, Seccion } from '../../../shared/models/wiki.modelos';

@Component({
  selector: 'app-lista-publicaciones',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './lista-publicaciones.html',
  styleUrl: './lista-publicaciones.scss'
})
export class ListaPublicacionesComponent implements OnInit {
  private wikiService = inject(WikiService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  secciones: Seccion[] = this.wikiService.getSecciones();
  publicaciones: Publicacion[] = [];
  publicacionesFiltradas: Publicacion[] = [];
  seccionSeleccionada: number | null = null;
  busqueda = '';
  orden: 'az' | 'za' | 'recientes' | 'antiguos' = 'recientes';
  cargando = true;
  error: string | null = null;

  readonly opcionesOrden = [
    { valor: 'recientes', etiqueta: 'Más recientes' },
    { valor: 'antiguos',  etiqueta: 'Más antiguos'  },
    { valor: 'az',        etiqueta: 'A → Z'          },
    { valor: 'za',        etiqueta: 'Z → A'          },
  ] as const;

  ngOnInit(): void {
  const seccionParam = this.route.snapshot.queryParamMap.get('seccion');
  if (seccionParam !== null) {
    const id = Number(seccionParam);
    if (!Number.isNaN(id)) {
      this.seccionSeleccionada = id;
    }
  }

  forkJoin({
    secciones: this.wikiService.listarSeccionesApi(),
    publicaciones: this.wikiService.listarPublicacionesApi()
  }).subscribe({
    next: (resultado) => {
      this.secciones = resultado.secciones;
      this.publicaciones = resultado.publicaciones;
      
      this.filtrar();
      this.cargando = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.error = 'No se pudieron cargar los datos de la plataforma.';
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
}

  filtrar(): void {
    let resultado = this.publicaciones;
    if (this.seccionSeleccionada !== null) {
      resultado = resultado.filter(p => p.id_seccion === Number(this.seccionSeleccionada));
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.trim().toLowerCase();
      resultado = resultado.filter(p =>
        p.titulo.toLowerCase().includes(q) ||
        p.nombre_cientifico.toLowerCase().includes(q)
      );
    }
    resultado = [...resultado].sort((a, b) => {
      switch (this.orden) {
        case 'az': return a.titulo.localeCompare(b.titulo, 'es');
        case 'za': return b.titulo.localeCompare(a.titulo, 'es');
        case 'antiguos': return a.fecha_creacion.localeCompare(b.fecha_creacion);
        default:   return b.fecha_creacion.localeCompare(a.fecha_creacion);
      }
    });
    this.publicacionesFiltradas = resultado;
  }

  cambiarOrden(orden: typeof this.orden): void {
    this.orden = orden;
    this.filtrar();
  }

  seleccionarSeccion(id: number | null): void {
    this.seccionSeleccionada = id;
    this.filtrar();
  }

  nombreSeccion(id: number): string {
    return this.secciones.find(s => s.id_seccion === id)?.nombre ?? '';
  }
}
