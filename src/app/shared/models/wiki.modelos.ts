export type RolUsuario = 'USUARIO' | 'MODERADOR' | 'ADMINISTRADOR';
export type EstadoPublicacion = 'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada';
export type TipoCampoPersonalizado = 'texto' | 'booleano' | 'numerico' | 'fecha';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  sexo: string | null;
  fechaRegistro: string | null;
  fechaNacimiento: string | null;
  pais: string | null;
  bio: string | null;
  fotoUrl: string | null;
}

export interface CampoPersonalizado {
  id_campo?: number;
  id_publicacion?: number;
  etiqueta: string;
  valor: string;
  tipo: TipoCampoPersonalizado;
}

export interface Publicacion {
  id_publicacion: number;
  id_seccion: number;
  id_autor: number;
  titulo: string;
  nombre_cientifico: string;
  foto_url: string;
  areas_habitat: string;
  dieta: string;
  horas_activas: string;
  estado: EstadoPublicacion;
  fecha_creacion: string;
  campos_extras?: CampoPersonalizado[];
  es_borrador?: boolean;
  id_borrador?: number;
}

export interface Borrador {
  id_borrador: number;
  id_autor: number;
  id_seccion: number;
  titulo: string;
  nombre_cientifico: string;
  foto_url: string;
  areas_habitat: string;
  dieta: string;
  horas_activas: string;
  campos_extras: CampoPersonalizado[];
  fecha_modificacion: string;
}

export interface Seccion {
  id_seccion: number;
  nombre: string;
  descripcion: string;
}

export interface PublicacionPendiente {
  id: number;
  titulo: string;
  foto: string | null;
  nombreCientifico: string;
  areasHabitat: string;
  dieta: string;
  horasActivas: string;
  estado: string;
  fechaCreacion: string;
  autorId: number;
  autorNombre: string;
  seccion: number;
  seccionNombre: string;
  camposExtra: { etiqueta: string; valor: string; tipo: string }[];
}