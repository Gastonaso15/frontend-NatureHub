import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Publicacion, Seccion, Borrador, Usuario } from '../../shared/models/wiki.modelos';
import { AutenticacionService } from '../../core/services/autenticacion';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WikiService {
  private publicaciones: Publicacion[] = [];
  private secciones: Seccion[] = [];
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private usuariosApiUrl = `${environment.apiUrl}/usuarios`;
  private publicacionesApiUrl = `${environment.apiUrl}/publicaciones`;

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

  obtenerPublicacionPorIdDirecto(id: number): Promise<Publicacion | undefined> {
    return firstValueFrom(
      this.http.post<any>(`${this.publicacionesApiUrl}/obtenerPublicacionPorId`, { id }).pipe(
        map(p => p ? this.mapPublicacionDesdeApi(p) : undefined),
        catchError(error => {
          console.error('Error al obtener publicación por id:', error);
          throw error;
        })
      )
    );
  }

  obtenerUsuarioPorId(id: number): Promise<Usuario | undefined> {
    return firstValueFrom(
      this.http.post<any>(`${this.usuariosApiUrl}/obtenerUsuarioId`, { id }).pipe(
        map(u => u ? AutenticacionService.mapUsuario(u) : undefined),
        catchError(error => {
          console.error('Error al obtener usuario por id:', error);
          throw error;
        })
      )
    );
  }

  eliminarPublicacion(id: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<any>(`${this.publicacionesApiUrl}/bajaPublicacion`, {
        body: { id }
      }).pipe(
        map(() => undefined),
        catchError(error => {
          console.error('Error al eliminar publicación:', error);
          throw error;
        })
      )
    );
  }

  reportarPublicacion(idPublicacion: number, idUsuario: number, motivo: string): Promise<void> {
    return firstValueFrom(
      this.http.post<any>(`${this.publicacionesApiUrl}/reportePublicacion`, {
        idPublicacion,
        idUsuario,
        motivo,
      }).pipe(
        map(() => undefined),
        catchError(error => {
          console.error('Error al reportar publicación:', error);
          throw error;
        })
      )
    );
  }

  listarReportesApi(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publicaciones/listarReportes`);
  }

  resolverReporteApi(idReporte: number): Observable<any> {
    return this.http.post(`${this.publicacionesApiUrl}/resolverReporte`, { idReporte });
  }

  agregarPublicacion(pub: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'>, fotoFile?: File): Promise<any> {
    const formData = new FormData();
    formData.append('titulo', pub.titulo);
    formData.append('nombreCientifico', pub.nombre_cientifico);
    const areasArray = pub.areas_habitat ? pub.areas_habitat.split(',').map(s => s.trim()) : [];
    formData.append('areasHabitat', JSON.stringify(areasArray));
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

    return firstValueFrom(this.http.post(`${this.publicacionesApiUrl}/altaPublicacion`, formData).pipe(
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
    const areasArray = pub.areas_habitat ? pub.areas_habitat.split(',').map(s => s.trim()) : [];
    formData.append('areasHabitat', JSON.stringify(areasArray));
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

    return firstValueFrom(
      this.http.post<{ mensaje: string; estado?: string }>(`${this.publicacionesApiUrl}/modificarPublicacion`, formData).pipe(
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
      this.http.post<{ id_borrador: number; mensaje: string }>(`${this.publicacionesApiUrl}/guardarBorrador`, formData).pipe(
        catchError((error) => {
          console.error('Error al guardar borrador:', error);
          throw error;
        })
      )
    );
  }

  obtenerBorrador(idAutor: number): Promise<Borrador | null> {
    return firstValueFrom(
      this.http.get<any>(`${this.publicacionesApiUrl}/obtenerBorrador`, { params: { idAutor } }).pipe(
        map((data) => {
          if (!data) return null;
          return this.mapBorradorDesdeApi(data);
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
      this.http.delete<{ mensaje: string }>(`${this.publicacionesApiUrl}/eliminarBorrador`, {
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

  private mapBorradorDesdeApi(data: any): Borrador {
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

  private normalizarEstado(estado: string): Publicacion['estado'] {
    const map: Record<string, Publicacion['estado']> = {
      'APROBADA': 'aprobada',
      'PENDIENTE_REVISION': 'pendiente_revision',
      'RECHAZADA': 'rechazada',
      'BORRADOR': 'borrador',
    };
    return map[estado?.toUpperCase()] ?? 'pendiente_revision';
  }

  mapPublicacionDesdeApi(p: any): Publicacion {
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
      estado: this.normalizarEstado(p.estado),
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
    return this.http.get<any[]>(`${this.publicacionesApiUrl}/listarPublicaciones`).pipe(
      tap(data => console.log('Publicaciones del API:', data)),
      map(data => data
        .filter(p => p.estado === 'APROBADA')
        .map(p => this.mapPublicacionDesdeApi(p))
      ),
      catchError(error => {
        console.error('Error al listar publicaciones:', error);
        throw error;
      })
    );
  }

  listarSeccionesApi(): Observable<Seccion[]> {
    return this.http.get<any[]>(`${this.publicacionesApiUrl}/listarSecciones`).pipe(
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

  listarPublicacionesPropiasApi(idAutor: number): Observable<Publicacion[]> {
    return this.http.post<any[]>(`${this.publicacionesApiUrl}/listarPublicacionesPropias`, {
      id: idAutor
    }).pipe(
      map(data => data.map(p => this.mapPublicacionDesdeApi(p))),
      catchError(error => {
        console.error('Error al listar publicaciones propias:', error);
        throw error;
      })
    );
  }

  listarPublicacionesPendientesApi(): Observable<any[]> {
    return this.http.get<any[]>(`${this.publicacionesApiUrl}/listarPublicacionesPendientes`);
  }

  moderarPublicacionApi(
    idPublicacion: number,
    idModerador: number,
    resultado: 'APROBADA' | 'RECHAZADA',
    motivoRechazo: string | null
  ): Observable<any> {
    const body: Record<string, unknown> = {
      idPublicacion,
      idModerador,
      resultado,
    };
    if (motivoRechazo) {
      body['motivoRechazo'] = motivoRechazo;
    }
    return this.http.post(`${this.publicacionesApiUrl}/moderarPublicacion`, body);
  }

}

