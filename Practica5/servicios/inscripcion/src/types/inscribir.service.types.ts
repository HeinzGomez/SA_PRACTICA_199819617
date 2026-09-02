export interface InscribirEstudianteInput {
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  tipo_inscripcion: string | null;
  usuario_responsable: number;
}

export interface ActualizarEstadoMatriculaInput {
  id_inscripcion: number;
  nuevo_estado: number;
  usuario_responsable: number;
}

export interface ConsultarCursosInput {
  id_usuario: number;
  anio: number;
  semestre: number;
  estado: string;
  pagina: number;
}

export interface ConsultarTodasInscripcionesInput {
  id_curso: number;
  anio: number;
  semestre: number;
  pagina: number;
}
