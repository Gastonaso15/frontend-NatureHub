import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion, Seccion, Usuario } from '../../../shared/models/wiki.modelos';

interface PublicacionConAutor extends Publicacion {
  nombreAutor?: string;
}

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
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  secciones: Seccion[] = this.wikiService.getSecciones();
  publicaciones: PublicacionConAutor[] = [];
  publicacionesFiltradas: PublicacionConAutor[] = [];
  usuarios: Usuario[] = [];
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
      publicaciones: this.wikiService.listarPublicacionesApi(),
      usuarios: this.http.get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`)
    }).subscribe({
      next: (resultado) => {
        this.secciones = resultado.secciones;
        this.usuarios = resultado.usuarios.map(u => ({
          id_usuario: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
          rol: u.rol,
          activo: u.activo,
          sexo: u.sexo ?? null,
          fechaRegistro: u.fechaRegistro ?? null,
          fechaNacimiento: u.fechaNacimiento ?? null,
          pais: u.pais ?? null,
          bio: u.bio ?? null,
          fotoUrl: u.fotoUrl ?? null
        }));

        this.publicaciones = resultado.publicaciones.map(p => ({
          ...p,
          nombreAutor: this.getNombreAutor(p.id_autor)
        }));

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

  private getNombreAutor(idAutor: number): string {
    const u = this.usuarios.find(u => u.id_usuario === idAutor);
    return u ? `${u.nombre} ${u.apellido}` : '';
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
        p.nombre_cientifico.toLowerCase().includes(q) ||
        (p.nombreAutor ?? '').toLowerCase().includes(q)
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

  seleccionarSeccion(id: number | null): void {
    this.seccionSeleccionada = id;
    this.filtrar();
  }

}