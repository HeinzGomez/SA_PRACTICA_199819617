export interface InscripcionResponse {
  id_inscripcion: number;
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  fecha_inscripcion: string;
  tipo_inscripcion: string | null;
}

export interface CursoEstudianteResponse {
  id_inscripcion: number;
  id_usuario: number;
  id_curso: number;
  codigo_curso: string;
  curso: string;
  codigo_area: string;
  area: string;
  anio: number;
  semestre: number;
  codigo_estado: string;
  estado_matricula: string;
  tipo_inscripcion: string | null;
  fecha_inscripcion: string;
}

export interface InscribirEstudianteRequest {
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  tipo_inscripcion: string;
  usuario_responsable: number;
}

export interface InscribirEstudianteResponse {
  exito: boolean;
  mensaje: string;
  inscripcion?: InscripcionResponse;
}

export interface ActualizarEstadoMatriculaRequest {
  id_inscripcion: number;
  nuevo_estado: number;
  usuario_responsable: number;
}

export interface ActualizarEstadoMatriculaResponse {
  exito: boolean;
  mensaje: string;
  inscripcion?: InscripcionResponse;
}

export interface ConsultarCursosEstudianteRequest {
  id_usuario: number;
  anio: number;
  semestre: number;
  estado: string;
  pagina: number;
}

export interface ConsultarCursosEstudianteResponse {
  exito: boolean;
  mensaje: string;
  registros: CursoEstudianteResponse[];
  total_paginas: number;
}

export interface ConsultarTodasInscripcionesRequest {
  id_curso: number;
  anio: number;
  semestre: number;
  pagina: number;
}

export interface ConsultarTodasInscripcionesResponse {
  exito: boolean;
  mensaje: string;
  registros: CursoEstudianteResponse[];
  total_paginas: number;
}

export interface EstadoMatriculaResponse {
  id_estado: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface ConsultarEstadosMatriculaRequest {
  [key: string]: never;
}

export interface ConsultarEstadosMatriculaResponse {
  exito: boolean;
  mensaje: string;
  estados: EstadoMatriculaResponse[];
}
