import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Publication, PublicationStatus, Section } from '../../shared/models/wiki.models';
import { environment } from '../../../environments/environment';

const SECTIONS: Section[] = [
  { id_seccion: 1, nombre: 'Mamíferos', descripcion: 'Vertebrados de sangre caliente con pelo o pelaje y lactancia de sus crías' },
  { id_seccion: 2, nombre: 'Aves', descripcion: 'Vertebrados con plumas, bípedos, generalmente alados y de sangre caliente' },
  { id_seccion: 3, nombre: 'Reptiles', descripcion: 'Vertebrados ectotérmicos con escamas o placas óseas en la piel' },
];

@Injectable({ providedIn: 'root' })
export class WikiService {
  private api = environment.apiUrl;
  private http = inject(HttpClient);
  private _publications = signal<Publication[]>([]);

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

  private mapPublication(raw: any): Publication {
    let areas = raw.areasHabitat;
    if (Array.isArray(areas)) areas = areas.join(', ');
    else if (typeof areas !== 'string') areas = String(areas ?? '');

    return {
      id_publicacion: raw.id,
      id_seccion: raw.seccion,
      id_autor: raw.autor,
      titulo: raw.titulo,
      nombre_cientifico: raw.nombreCientifico,
      foto_url: raw.foto,
      areas_habitat: areas,
      dieta: raw.dieta,
      horas_activas: raw.horasActivas,
      estado: ((raw.estado as string)?.toLowerCase() ?? 'pendiente_revision') as PublicationStatus,
      fecha_creacion: raw.fechaCreacion ?? '',
      campos_extras: []
    };
  }

  getPublications(): Observable<Publication[]> {
    return this.http.get<any[]>(`${this.api}/publicaciones/listarPublicaciones`).pipe(
      map(res => res.map(p => this.mapPublication(p))),
      tap(pubs => this._publications.set(pubs)),
      catchError(() => of([]))
    );
  }

  addPublication(
    pub: Omit<Publication, 'id_publicacion' | 'fecha_creacion' | 'estado'>
  ): Observable<boolean> {
    const body = {
      titulo: pub.titulo,
      foto: pub.foto_url,
      nombreCientifico: pub.nombre_cientifico,
      areasHabitat: pub.areas_habitat,
      dieta: pub.dieta,
      horasActivas: pub.horas_activas,
      autor: pub.id_autor,
      seccion: pub.id_seccion
    };
    return this.http.post<any>(`${this.api}/publicaciones/altaPublicacion`, body).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
