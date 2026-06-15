import { Injectable } from '@angular/core';
import { Publicacion, Seccion } from '../../shared/models/wiki.models';

const SECCIONES: Seccion[] = [
  { id_seccion: 1, nombre: 'Mamíferos', descripcion: 'Vertebrados de sangre caliente con pelo o pelaje y lactancia de sus crías' },
  { id_seccion: 2, nombre: 'Aves', descripcion: 'Vertebrados con plumas, bípedos, generalmente alados y de sangre caliente' },
  { id_seccion: 3, nombre: 'Reptiles', descripcion: 'Vertebrados ectotérmicos con escamas o placas óseas en la piel' },
];

const PUBLICACIONES: Publicacion[] = [
  {
    id_publicacion: 1,
    id_seccion: 1,
    id_autor: 1,
    titulo: 'Zorro Pampeano',
    nombre_cientifico: 'Lycalopex gymnocercus',
    foto_url: 'https://picsum.photos/seed/fox-pampa/600/400',
    areas_habitat: 'Pampas, pastizales y zonas agrícolas del sur de Sudamérica, especialmente en Uruguay y Argentina.',
    dieta: 'Omnívoro. Se alimenta de roedores, conejos, insectos, frutas silvestres y ocasionalmente carroña.',
    horas_activas: 'Crepuscular y nocturno. En zonas alejadas del ser humano puede ser activo de día.',
    estado: 'publicada',
    fecha_creacion: '2026-01-15',
    campos_extras: []
  },
  {
    id_publicacion: 2,
    id_seccion: 2,
    id_autor: 1,
    titulo: 'Águila Coronada',
    nombre_cientifico: 'Buteogallus coronatus',
    foto_url: 'https://picsum.photos/seed/eagle-crown/600/400',
    areas_habitat: 'Pastizales abiertos, sabanas y áreas agrícolas de Brasil, Bolivia, Argentina y Uruguay.',
    dieta: 'Carnívoro. Caza armadillos, vizcachas, zorros y reptiles de gran porte.',
    horas_activas: 'Diurno. Más activo durante las horas de la mañana y al atardecer.',
    estado: 'publicada',
    fecha_creacion: '2026-01-20',
    campos_extras: [
      { etiqueta: 'Estado de conservación', valor: 'En peligro', tipo: 'texto' }
    ]
  },
  {
    id_publicacion: 3,
    id_seccion: 3,
    id_autor: 2,
    titulo: 'Lagarto Overo',
    nombre_cientifico: 'Salvator merianae',
    foto_url: 'https://picsum.photos/seed/lizard-tegu/600/400',
    areas_habitat: 'Bosques, pastizales, márgenes de ríos y zonas urbanas de gran parte de Sudamérica.',
    dieta: 'Omnívoro. Consume frutos, huevos, pequeños vertebrados, invertebrados y carroña.',
    horas_activas: 'Diurno. Termorregula tomando sol en las mañanas antes de iniciar su actividad.',
    estado: 'publicada',
    fecha_creacion: '2026-02-01',
    campos_extras: [
      { etiqueta: 'Longitud máxima', valor: '1.5 metros', tipo: 'texto' },
      { etiqueta: 'Especie invasora en Florida', valor: 'Sí', tipo: 'texto' }
    ]
  },
  {
    id_publicacion: 4,
    id_seccion: 1,
    id_autor: 1,
    titulo: 'Carpincho',
    nombre_cientifico: 'Hydrochoerus hydrochaeris',
    foto_url: 'https://picsum.photos/seed/capybara-river/600/400',
    areas_habitat: 'Orillas de ríos, lagunas y bañados de Sudamérica tropical y subtropical.',
    dieta: 'Herbívoro. Se alimenta principalmente de gramíneas acuáticas, hierbas y cortezas.',
    horas_activas: 'Crepuscular y nocturno, aunque puede verse activo durante el día en zonas tranquilas.',
    estado: 'publicada',
    fecha_creacion: '2026-02-10',
    campos_extras: [
      { etiqueta: 'Peso promedio adulto', valor: '50 kg', tipo: 'texto' },
      { etiqueta: 'Roedor más grande del mundo', valor: 'Sí', tipo: 'texto' }
    ]
  },
  {
    id_publicacion: 5,
    id_seccion: 2,
    id_autor: 2,
    titulo: 'Ñandú',
    nombre_cientifico: 'Rhea americana',
    foto_url: 'https://picsum.photos/seed/nandu-rhea/600/400',
    areas_habitat: 'Pastizales abiertos y llanuras de Brasil, Bolivia, Argentina, Paraguay y Uruguay.',
    dieta: 'Omnívoro. Come plantas, semillas, frutas, insectos y pequeños animales.',
    horas_activas: 'Diurno. Activo desde el amanecer hasta el atardecer.',
    estado: 'publicada',
    fecha_creacion: '2026-02-18',
    campos_extras: [
      { etiqueta: 'Ave más grande de América del Sur', valor: 'Sí', tipo: 'texto' }
    ]
  },
];

@Injectable({ providedIn: 'root' })
export class WikiService {
  private publicaciones: Publicacion[] = [...PUBLICACIONES];

  getSecciones(): Seccion[] {
    return SECCIONES;
  }

  getArticulosDestacados(): Publicacion[] {
    return this.publicaciones.filter(p => p.estado === 'publicada').slice(0, 4);
  }

  getPublicados(): Publicacion[] {
    return this.publicaciones.filter(p => p.estado === 'publicada');
  }

  getPublicacionPorId(id: number): Publicacion | undefined {
    return this.publicaciones.find(p => p.id_publicacion === id);
  }

  getPublicacionesPorSeccion(idSeccion: number): Publicacion[] {
    return this.publicaciones.filter(p => p.id_seccion === idSeccion && p.estado === 'publicada');
  }

  buscarPublicaciones(consulta: string): Publicacion[] {
    const q = consulta.toLowerCase();
    return this.publicaciones.filter(p =>
      p.estado === 'publicada' && (
        p.titulo.toLowerCase().includes(q) ||
        p.nombre_cientifico.toLowerCase().includes(q) ||
        p.areas_habitat.toLowerCase().includes(q)
      )
    );
  }

  agregarPublicacion(pub: Omit<Publicacion, 'id_publicacion' | 'fecha_creacion' | 'estado'>): Publicacion {
    const nuevaPublicacion: Publicacion = {
      ...pub,
      id_publicacion: Date.now(),
      fecha_creacion: new Date().toISOString().split('T')[0],
      estado: 'pendiente_revision'
    };
    this.publicaciones.push(nuevaPublicacion);
    return nuevaPublicacion;
  }

  getSeccionPorId(id: number): Seccion | undefined {
    return SECCIONES.find(s => s.id_seccion === id);
  }
}
