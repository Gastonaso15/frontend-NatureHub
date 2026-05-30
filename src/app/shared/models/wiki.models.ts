export type UserRole = 'usuario' | 'moderador' | 'administrador';
export type PublicationStatus = 'borrador' | 'pendiente_revision' | 'aprobada' | 'rechazada' | 'publicada';
export type CustomFieldType = 'texto' | 'booleano' | 'numerico' | 'fecha';

export interface User {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  activo: boolean;
}

export interface CustomField {
  id_campo?: number;
  id_publicacion?: number;
  etiqueta: string;
  valor: string;
  tipo: CustomFieldType;
}

export interface Publication {
  id_publicacion: number;
  id_seccion: number;
  id_autor: number;
  titulo: string;
  nombre_cientifico: string;
  foto_url: string;
  areas_habitat: string;
  dieta: string;
  horas_activas: string;
  estado: PublicationStatus;
  fecha_creacion: string;
  campos_extras?: CustomField[];
}

export interface Section {
  id_seccion: number;
  nombre: string;
  descripcion: string;
}