import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient);
  private location = inject(Location);
  private authService = inject(AutenticacionService);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php';

  articulo = signal<Publicacion | null>(null);
  seccion = signal<Seccion | null>(null);
  autor = signal<Usuario | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  procesando = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDesdeApi(id);
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
    this.http.delete(`${this.apiUrl}/publicaciones/bajaPublicacion`, {
      body: { id: pub.id_publicacion }
    }).subscribe({
      next: () => {
        this.procesando.set(false);
        Swal.fire({
          title: 'Artículo eliminado',
          text: 'El artículo fue eliminado correctamente.',
          icon: 'success',
          confirmButtonColor: '#2d6a4f',
        }).then(() => this.location.back());
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.error ?? 'No se pudo eliminar el artículo.';
        Swal.fire('Error', msg, 'error');
      },
    });
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
    this.http.post(`${this.apiUrl}/publicaciones/reportePublicacion`, {
      idPublicacion: pub.id_publicacion,
      idUsuario: user.id_usuario,
      motivo: motivo.trim(),
    }).subscribe({
      next: () => {
        this.procesando.set(false);
        Swal.fire({
          title: 'Reporte enviado',
          text: 'Gracias por contribuir a mantener la calidad de NatureHub. Un moderador revisará tu reporte.',
          icon: 'success',
          confirmButtonColor: '#2d6a4f',
        });
      },
      error: (err) => {
        this.procesando.set(false);
        const msg = err?.error?.error ?? 'No se pudo enviar el reporte.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  volver(): void {
    this.location.back();
  }
}