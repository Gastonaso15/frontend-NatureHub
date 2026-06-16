import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  private cdr = inject(ChangeDetectorRef);

  secciones: Seccion[] = this.wikiService.getSecciones();
  publicaciones: Publicacion[] = [];
  publicacionesFiltradas: Publicacion[] = [];
  seccionSeleccionada: number | null = null;
  busqueda = '';
  cargando = true;
  error: string | null = null;

  ngOnInit(): void {
    this.wikiService.listarPublicacionesApi().subscribe({
      next: (data) => {
        this.publicaciones = data;
        this.publicacionesFiltradas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las publicaciones.';
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
    this.publicacionesFiltradas = resultado;
  }

  seleccionarSeccion(id: number | null): void {
    this.seccionSeleccionada = id;
    this.filtrar();
  }

  nombreSeccion(id: number): string {
    return this.secciones.find(s => s.id_seccion === id)?.nombre ?? '';
  }
}
