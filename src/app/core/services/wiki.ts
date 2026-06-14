import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { CustomField, CustomFieldType, Publication, PublicationStatus, Section } from '../../shared/models/wiki.models';
import { environment } from '../../../environments/environment';

const SECTIONS: Section[] = [
  { id_seccion: 1, nombre: 'Mamíferos', descripcion: 'Vertebrados de sangre caliente con pelo o pelaje y lactancia de sus crías' },
  { id_seccion: 2, nombre: 'Aves', descripcion: 'Vertebrados con plumas, bípedos, generalmente alados y de sangre caliente' },
  { id_seccion: 3, nombre: 'Reptiles', descripcion: 'Vertebrados ectotérmicos con escamas o placas óseas en la piel' },
];

@Injectable({ providedIn: 'root' })
export class WikiService {
  private api = environment.apiUrl.replace(/\/$/, '');
  private http = inject(HttpClient);
  private _publications = signal<Publication[]>([]);
  lastError = signal<string | null>(null);

  getSections(): Section[] {
    return SECTIONS;
  }

  getSectionById(id: number): Section | undefined {
    return SECTIONS.find(s => s.id_seccion === id);
  }

  getPublicationById(id: number): Publication | undefined {
    return this._publications().find(p => p.id_publicacion === id);
  }

  getPublicationsBySection(sectionId: number): Publication[] {
    return this._publications().filter(p => p.id_seccion === sectionId);
  }

  searchPublications(query: string): Publication[] {
    const q = query.toLowerCase();
    return this._publications().filter(
      p =>
        p.titulo.toLowerCase().includes(q) ||
        p.nombre_cientifico.toLowerCase().includes(q) ||
        p.areas_habitat.toLowerCase().includes(q)
    );
  }

  getPublications(): Observable<Publication[]> {
    this.lastError.set(null);
    return this.http.get<any[]>(`${this.api}/publicaciones/listarPublicaciones`).pipe(
      map(res => res.map(p => this.mapPublication(p))),
      tap(pubs => this._publications.set(pubs)),
      catchError(error => {
        this.lastError.set(this.extractError(error, 'No se pudieron cargar las publicaciones.'));
        return of([]);
      })
    );
  }

  addPublication(
    pub: Omit<Publication, 'id_publicacion' | 'fecha_creacion' | 'estado'>
  ): Observable<boolean> {
    const body = {
      titulo: pub.titulo,
      foto: pub.foto_url,
      nombreCientifico: pub.nombre_cientifico,
      areasHabitat: this.toAreasArray(pub.areas_habitat),
      dieta: pub.dieta,
      horasActivas: pub.horas_activas,
      autor: pub.id_autor,
      seccion: Number(pub.id_seccion),
      camposExtra: (pub.campos_extras ?? []).map(field => ({
        etiqueta: field.etiqueta,
        valor: field.valor,
        tipo: field.tipo.toUpperCase()
      }))
    };

    this.lastError.set(null);
    return this.http.post<any>(`${this.api}/publicaciones/altaPublicacion`, body).pipe(
      map(() => true),
      catchError(error => {
        this.lastError.set(this.extractError(error, 'No se pudo crear la publicación.'));
        return of(false);
      })
    );
  }

  private mapPublication(raw: any): Publication {
    let areas = raw.areasHabitat;
    if (Array.isArray(areas)) areas = areas.join(', ');
    else if (typeof areas !== 'string') areas = String(areas ?? '');

    return {
      id_publicacion: Number(raw.id),
      id_seccion: Number(raw.seccion),
      id_autor: Number(raw.autor),
      titulo: raw.titulo ?? '',
      nombre_cientifico: raw.nombreCientifico ?? '',
      foto_url: raw.foto ?? '',
      areas_habitat: areas,
      dieta: raw.dieta ?? '',
      horas_activas: raw.horasActivas ?? '',
      estado: this.normalizeStatus(raw.estado),
      fecha_creacion: raw.fechaCreacion ?? '',
      campos_extras: this.mapCustomFields(raw.camposExtra)
    };
  }

  private toAreasArray(areas: string): string[] {
    return areas
      .split(',')
      .map(area => area.trim())
      .filter(Boolean);
  }

  private mapCustomFields(rawFields: any): CustomField[] {
    if (!Array.isArray(rawFields)) return [];
    return rawFields.map(field => ({
      id_campo: field.id,
      id_publicacion: field.idPublicacion,
      etiqueta: field.etiqueta ?? '',
      valor: field.valor ?? '',
      tipo: this.normalizeFieldType(field.tipo)
    }));
  }

  private normalizeStatus(status: unknown): PublicationStatus {
    return String(status ?? 'PENDIENTE_REVISION').toLowerCase() as PublicationStatus;
  }

  private normalizeFieldType(type: unknown): CustomFieldType {
    const value = String(type ?? 'TEXTO').toLowerCase();
    if (value === 'booleano' || value === 'numerico' || value === 'fecha') {
      return value;
    }
    return 'texto';
  }

  private extractError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.error ?? error.message ?? fallback;
    }
    return fallback;
  }
}
