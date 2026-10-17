// HeinzGomez - Práctica 9: examen, intento y diploma que produce certificados-service (Python).

export interface OpcionExamen {
  id: string;
  texto: string;
}

export interface PreguntaExamen {
  id: string;
  enunciado: string;
  opciones: OpcionExamen[];
}

/** Examen tal como se entrega al estudiante (sin la respuesta correcta). */
export interface Examen {
  evento_id: string;
  nota_minima: number;
  preguntas: PreguntaExamen[];
}

export interface RespuestaExamen {
  pregunta_id: string;
  opcion_id: string;
}

export interface ResultadoExamen {
  intento_id: string;
  aprobado: boolean;
  nota: number;
  correctas: number;
  total: number;
}

export interface SolicitudCertificado {
  usuario_id: string;
  evento_id: string;
  nombre_estudiante: string;
  evento_titulo: string;
  curso_codigo: string;
  curso_nombre: string;
}

export interface Certificado {
  id: string;
  usuario_id: string;
  nombre_estudiante: string;
  evento_id: string;
  evento_titulo: string;
  curso_codigo: string;
  curso_nombre: string;
  nota: number;
  emitido_en: string;
  codigo_hash: string;
  firma: string;
}

export interface FiltroCertificados {
  usuario_id: string;
  curso_codigo: string;
  fecha_desde: string;
  fecha_hasta: string;
}

export interface Verificacion {
  valido: boolean;
  mensaje: string;
  certificado: Certificado | null;
}

// --- administración de exámenes (solo ADMINISTRADOR)
export interface OpcionPregunta {
  texto: string;
  es_correcta?: boolean;
}

export interface SolicitudNuevaPregunta {
  id_examen: number;
  enunciado: string;
  opciones: OpcionPregunta[];
  punteo?: number;
}

export interface PreguntaCreada {
  id_pregunta: string | number;
  id_examen: number;
  enunciado: string;
  punteo: number;
  opciones: { id_opcion: string; texto: string; es_correcta: boolean }[];
}

export interface SolicitudNuevoExamen {
  evento_id: string;
  titulo: string;
  puntaje_minimo?: number;
  estado?: string;
}

export interface ExamenAdmin {
  id_examen: number;
  evento_id: string;
  titulo: string;
  puntaje_minimo: number;
  estado: string;
  preguntas: PreguntaCreada[];
}
