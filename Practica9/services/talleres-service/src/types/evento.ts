// HeinzGomez - Práctica 9: modelo de dominio del Servicio de Talleres / Eventos académicos (CDU 2.x)
export type TipoEvento = 'TALLER' | 'CONFERENCIA' | 'LABORATORIO' | 'CERTIFICACION';
export const TIPOS: TipoEvento[] = ['TALLER', 'CONFERENCIA', 'LABORATORIO', 'CERTIFICACION'];

export interface Ponente {
  nombre: string;
  titulo: string;
  bio: string;
  correo: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  curso_codigo: string;
  curso_nombre: string;
  fecha_inicio: string; // ISO-8601
  duracion_min: number;
  lugar: string;
  cupo_total: number;
  cupo_disponible: number;
  ponente: Ponente;
  prerrequisitos: string[];
  tiene_certificacion: boolean;
}

export interface FiltroEventos {
  curso_codigo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo?: string;
}

export interface Cupo {
  evento_id: string;
  cupo_total: number;
  cupo_disponible: number;
}
