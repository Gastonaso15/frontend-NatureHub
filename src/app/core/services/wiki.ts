import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Publicacion, Seccion, Borrador } from '../../shared/models/wiki.modelos';

@Injectable({ providedIn: 'root' })
export class WikiService {
  private publicaciones: Publicacion[] = [];
  private secciones: Seccion[] = [];
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/backend-NatureHub/src/index.php/publicaciones';

  getSecciones(): Seccion[] {
    return this.secciones;
  }

  getArticulosDestacados(): Publicacion[] {
    return this.publicaciones.filter(p => p.estado === 'aprobada').slice(0, 4);
  }

  getPublicados(): Publicacion[] {
    return this.publicaciones.filter(p => p.estado === 'aprobada');
  }

  getPublicacionPorId(id: number): Publicacion | undefined {
    return this.publicaciones.find(p => p.id_publicacion === id);
  }

  getPublicacionesPorSeccion(idSeccion: number): Publicacion[] {
    return this.publicaciones.filter(p => p.id_seccion === idSeccion && p.estado === 'aprobada');
  }

  buscarPublicaciones(consulta: string): Publicacion[] {
    const q = consulta.toLowerCase();
    return this.publicaciones.filter(p =>
      p.estado === 'aprobada' && (
        p.titulo.toLowerCase().includes(q) ||
        p.nombre_cientifico.toLowerCase().includes(q) ||
        p.areas_habitat.toLowerCase().includes(q)
      )
    );
  }

  agregarPublicacion(pub: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'>, fotoFile?: File): Promise<any> {
    const formData = new FormData();
    formData.append('titulo', pub.titulo);
    formData.append('nombreCientifico', pub.nombre_cientifico);
    formData.append('areasHabitat', JSON.stringify([pub.areas_habitat]));
    formData.append('dieta', pub.dieta);
    formData.append('horasActivas', pub.horas_activas);
    formData.append('autor', String(pub.id_autor));
    formData.append('camposExtra', JSON.stringify(pub.campos_extras ?? []));
    formData.append('seccion', String(pub.id_seccion));

    if (fotoFile) {
      formData.append('foto', fotoFile, fotoFile.name);
    } else if (pub.foto_url) {
      formData.append('fotoUrl', pub.foto_url);
    }

    return firstValueFrom(this.http.post(`${this.apiUrl}/altaPublicacion`, formData).pipe(
      tap((response: any) => {
        console.log('Respuesta exitosa:', response);
      }),
      catchError((error) => {
        console.error('Error en la solicitud:', error);
        throw error;
      })
    ));
  }

  modificarPublicacion(pub: Publicacion, fotoFile?: File): Promise<{ mensaje: string; estado?: string }> {
    const formData = new FormData();
    formData.append('id', String(pub.id_publicacion));
    formData.append('titulo', pub.titulo);
    formData.append('nombreCientifico', pub.nombre_cientifico);
    formData.append('areasHabitat', JSON.stringify([pub.areas_habitat]));
    formData.append('dieta', pub.dieta);
    formData.append('horasActivas', pub.horas_activas);
    formData.append('autor', String(pub.id_autor));
    formData.append('camposExtra', JSON.stringify(pub.campos_extras ?? []));
    formData.append('seccion', String(pub.id_seccion));

    if (fotoFile) {
      formData.append('foto', fotoFile, fotoFile.name);
    } else if (pub.foto_url) {
      formData.append('foto', pub.foto_url);
    }

    return firstValueFrom(
      this.http.post<{ mensaje: string; estado?: string }>(`${this.apiUrl}/modificarPublicacion`, formData).pipe(
        catchError((error) => {
          console.error('Error al modificar publicación:', error);
          throw error;
        })
      )
    );
  }

  guardarBorrador(
    datos: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'>,
    fotoFile?: File
  ): Promise<{ id_borrador: number; mensaje: string }> {
    const formData = new FormData();
    formData.append('autor', String(datos.id_autor));
    formData.append('titulo', datos.titulo ?? '');
    formData.append('nombreCientifico', datos.nombre_cientifico ?? '');
    formData.append('areasHabitat', datos.areas_habitat ?? '');
    formData.append('dieta', datos.dieta ?? '');
    formData.append('horasActivas', datos.horas_activas ?? '');
    formData.append('camposExtra', JSON.stringify(datos.campos_extras ?? []));
    formData.append('seccion', String(datos.id_seccion ?? 1));

    if (fotoFile) {
      formData.append('foto', fotoFile, fotoFile.name);
    } else if (datos.foto_url) {
      formData.append('fotoUrl', datos.foto_url);
    }

    return firstValueFrom(
      this.http.post<{ id_borrador: number; mensaje: string }>(`${this.apiUrl}/guardarBorrador`, formData).pipe(
        catchError((error) => {
          console.error('Error al guardar borrador:', error);
          throw error;
        })
      )
    );
  }

  obtenerBorrador(idAutor: number): Promise<Borrador | null> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/obtenerBorrador`, { params: { idAutor } }).pipe(
        map((data) => {
          if (!data) return null;
          return this.mapBorradorFromApi(data);
        }),
        catchError((error) => {
          console.error('Error al obtener borrador:', error);
          throw error;
        })
      )
    );
  }

  eliminarBorrador(idAutor: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<{ mensaje: string }>(`${this.apiUrl}/eliminarBorrador`, {
        body: { idAutor },
      }).pipe(
        map(() => undefined),
        catchError((error) => {
          console.error('Error al eliminar borrador:', error);
          throw error;
        })
      )
    );
  }

  borradorComoPublicacion(borrador: Borrador): Publicacion {
    return {
      id_publicacion: 0,
      id_borrador: borrador.id_borrador,
      id_seccion: borrador.id_seccion ?? 1,
      id_autor: borrador.id_autor,
      titulo: borrador.titulo || 'Borrador sin título',
      nombre_cientifico: borrador.nombre_cientifico || 'Sin nombre científico',
      foto_url: borrador.foto_url ?? '',
      areas_habitat: borrador.areas_habitat ?? '',
      dieta: borrador.dieta ?? '',
      horas_activas: borrador.horas_activas ?? '',
      estado: 'borrador',
      fecha_creacion: borrador.fecha_modificacion,
      campos_extras: borrador.campos_extras ?? [],
      es_borrador: true,
    };
  }

  private mapBorradorFromApi(data: any): Borrador {
    return {
      id_borrador: data.id_borrador,
      id_autor: data.autor,
      id_seccion: data.seccion ?? 1,
      titulo: data.titulo ?? '',
      nombre_cientifico: data.nombreCientifico ?? '',
      foto_url: data.foto ?? '',
      areas_habitat: data.areasHabitat ?? '',
      dieta: data.dieta ?? '',
      horas_activas: data.horasActivas ?? '',
      campos_extras: (data.camposExtra ?? []).map((c: any) => ({
        etiqueta: c.etiqueta ?? '',
        valor: c.valor ?? '',
        tipo: (c.tipo ?? 'texto').toLowerCase(),
      })),
      fecha_modificacion: data.fechaModificacion ?? '',
    };
  }

  obtenerPublicacionPorIdApi(id: number): Promise<Publicacion | undefined> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/listarPublicaciones`).pipe(
        map((data) => {
          const p = data.find((item) => Number(item.id) === Number(id));
          if (!p) return undefined;
          return this.mapPublicacionFromApi(p);
        }),
        catchError((error) => {
          console.error('Error al obtener publicación:', error);
          throw error;
        })
      )
    );
  }

  private mapPublicacionFromApi(p: any): Publicacion {
    return {
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
      estado: (p.estado ?? '').toLowerCase() as Publicacion['estado'],
      fecha_creacion: p.fechaCreacion ?? '',
      campos_extras: (p.camposExtra ?? []).map((c: any) => ({
        id_campo: c.id,
        id_publicacion: p.id,
        etiqueta: c.etiqueta,
        valor: c.valor,
        tipo: (c.tipo ?? 'texto').toLowerCase(),
      })),
    };
  }

  getSeccionPorId(id: number): Seccion | undefined {
    return this.secciones.find(s => s.id_seccion === id);
  }

  listarPublicacionesApi(): Observable<Publicacion[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listarPublicaciones`).pipe(
      tap(data => console.log('Publicaciones del API:', data)),
      map(data => data
        .filter(p => p.estado === 'APROBADA')
        .map(p => ({
          id_publicacion: p.id,
          id_seccion: p.seccion,
          id_autor: p.autor,
          titulo: p.titulo,
          nombre_cientifico: p.nombreCientifico,
          foto_url: p.foto,
          areas_habitat: Array.isArray(p.areasHabitat) ? p.areasHabitat.join(', ') : p.areasHabitat,
          dieta: p.dieta,
          horas_activas: p.horasActivas,
          estado: p.estado,
          fecha_creacion: p.fechaCreacion,
          campos_extras: p.camposExtra ?? []
        } as Publicacion))
      ),
      catchError(error => {
        console.error('Error al listar publicaciones:', error);
        throw error;
      })
    );
  }

  listarSeccionesApi(): Observable<Seccion[]> {
    return this.http.get<any[]>(`${this.apiUrl}/listarSecciones`).pipe(
      map(data => data.map(s => ({
        id_seccion: s.id_seccion,
        nombre: s.nombre,
        descripcion: s.descripcion
      }))),
      tap(secciones => this.secciones = secciones),
      catchError(error => {
        console.error('Error al listar secciones:', error);
        throw error;
      })
    );
  }

}
