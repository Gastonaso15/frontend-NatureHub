import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { SlicePipe } from '@angular/common';
import { WikiService } from '../../../core/services/wiki';
import { Publicacion, Seccion, Usuario } from '../../../shared/models/wiki.models';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.scss'
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private wikiService = inject(WikiService);
  private http = inject(HttpClient);
  private location = inject(Location);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  articulo = signal<Publicacion | null>(null);
  seccion = signal<Seccion | null>(null);
  autor = signal<Usuario | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDesdeApi(id);
  }

  private cargarDesdeApi(id: number): void {
    this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarPublicaciones`).subscribe({
      next: (data) => {
        const encontrada = data.find((p) => p.id === id);
        if (encontrada) {
          const pub: Publicacion = {
            id_publicacion: encontrada.id,
            id_seccion: encontrada.seccion,
            id_autor: encontrada.autor,
            titulo: encontrada.titulo,
            nombre_cientifico: encontrada.nombreCientifico,
            foto_url: encontrada.foto ?? '',
            areas_habitat: Array.isArray(encontrada.areasHabitat)
              ? encontrada.areasHabitat.join(', ')
              : (encontrada.areasHabitat ?? ''),
            dieta: encontrada.dieta,
            horas_activas: encontrada.horasActivas,
            estado: encontrada.estado,
            fecha_creacion: encontrada.fechaCreacion ?? '',
            campos_extras: encontrada.camposExtra ?? [],
          };
          this.articulo.set(pub);
          this.seccion.set(this.wikiService.getSeccionPorId(pub.id_seccion) ?? null);
          this.cargarAutor(pub.id_autor);
        } else {
          this.error.set('Artículo no encontrado.');
          this.cargando.set(false);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el artículo.');
        this.cargando.set(false);
      },
    });
  }

  private cargarAutor(autorId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/usuarios/listarUsuarios`).subscribe({
      next: (usuarios) => {
        const encontrado = usuarios.find((u) => u.id === autorId);
        if (encontrado) {
          this.autor.set({
            id_usuario: encontrado.id,
            nombre: encontrado.nombre,
            apellido: encontrado.apellido,
            email: encontrado.email,
            rol: encontrado.rol,
            activo: encontrado.activo,
            sexo: encontrado.sexo ?? null,
            fechaRegistro: encontrado.fechaRegistro ?? null,
            fechaNacimiento: encontrado.fechaNacimiento ?? null,
            pais: encontrado.pais ?? null,
            bio: encontrado.bio ?? null,
            fotoUrl: encontrado.fotoUrl ?? null,
          });
        }
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.location.back();
  }
}