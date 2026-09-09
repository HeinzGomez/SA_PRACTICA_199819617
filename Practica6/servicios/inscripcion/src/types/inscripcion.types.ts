export interface InscribirEstudianteParams {
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  tipo_inscripcion: string | null;
  usuario_responsable: number;
}

export interface ActualizarEstadoMatriculaParams {
  id_inscripcion: number;
  nuevo_estado: number;
  usuario_responsable: number;
}

export interface InscripcionRow {
  id_inscripcion: number;
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  fecha_inscripcion: Date;
  tipo_inscripcion: string | null;
}

export interface PeriodoRow {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface EstadoMatriculaRow {
  id_estado: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface ConsultarCursosParams {
  id_usuario: number;
  anio: number;
  semestre: number;
  estado: string;
  pagina: number;
}

export interface ConsultarCursosResult {
  registros: CursoEstudianteRow[];
  total_paginas: number;
}

export interface CursoEstudianteRow {
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
  fecha_inscripcion: Date;
}

export interface ConsultarTodasInscripcionesParams {
  id_curso: number;
  anio: number;
  semestre: number;
  pagina: number;
}

export interface ConsultarTodasInscripcionesResult {
  registros: CursoEstudianteRow[];
  total_paginas: number;
}
