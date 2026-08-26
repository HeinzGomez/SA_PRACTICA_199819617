export interface Area {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_area: number;
  fecha_inscripcion: string;
}

export interface Pensum {
  id_pensum: number;
  nombre: string;
  descripcion: string;
}

export interface Periodo {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface Carrera {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string;
  id_pensum: number;
  fecha_creacion: string;
}

export interface PerfilAcademico {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  dpi: string;
  fecha_nacimiento: string;
  telefono: string;
  id_carrera: number;
  direccion: string;
}

export interface UsuarioRol {
  id_usuario: number;
  id_rol: number;
  rol: string;
  descripcion: string;
}

export interface Inscripcion {
  id_inscripcion: number;
  id_usuario: number;
  id_curso: number;
  id_periodo: number;
  id_estado_matricula: number;
  fecha_inscripcion: string;
  tipo_inscripcion: string;
}

export interface CursoEstudiante {
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
  tipo_inscripcion: string;
  fecha_inscripcion: string;
}

export interface PerfilEstudiante {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  id_carrera: number;
  carrera: string;
  facultad: string;
}

export interface AuditLog {
  id_auditoria: number;
  usuario_responsable: number;
  operacion: string;
  tabla_afectada: string;
  fecha_evento: string;
  estado_anterior: string;
  estado_nuevo: string;
}

export interface CrearAreaRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface CrearAreaResponse {
  exito: boolean;
  mensaje: string;
  area?: Area;
}

export interface EditarAreaRequest {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface EditarAreaResponse {
  exito: boolean;
  mensaje: string;
  area?: Area;
}

export interface EliminarAreaRequest {
  id_area: number;
}

export interface EliminarAreaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarAreasRequest {
  [key: string]: never;
}

export interface ConsultarAreasResponse {
  exito: boolean;
  mensaje: string;
  areas: Area[];
}

export interface CrearCursoRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  id_area: number;
}

export interface CrearCursoResponse {
  exito: boolean;
  mensaje: string;
  curso?: Curso;
}

export interface EditarCursoRequest {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_area: number;
}

export interface EditarCursoResponse {
  exito: boolean;
  mensaje: string;
  curso?: Curso;
}

export interface EliminarCursoRequest {
  id_curso: number;
}

export interface EliminarCursoResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCursosRequest {
  id_area: number;
}

export interface ConsultarCursosResponse {
  exito: boolean;
  mensaje: string;
  cursos: Curso[];
}

export interface CrearPensumRequest {
  nombre: string;
  descripcion: string;
}

export interface CrearPensumResponse {
  exito: boolean;
  mensaje: string;
  pensum?: Pensum;
}

export interface EditarPensumRequest {
  id_pensum: number;
  nombre: string;
  descripcion: string;
}

export interface EditarPensumResponse {
  exito: boolean;
  mensaje: string;
  pensum?: Pensum;
}

export interface EliminarPensumRequest {
  id_pensum: number;
}

export interface EliminarPensumResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarPensumsRequest {
  [key: string]: never;
}

export interface ConsultarPensumsResponse {
  exito: boolean;
  mensaje: string;
  pensums: Pensum[];
}

export interface CrearCarreraRequest {
  facultad: string;
  nombre: string;
  descripcion: string;
  id_pensum: number;
}

export interface CrearCarreraResponse {
  exito: boolean;
  mensaje: string;
  carrera?: Carrera;
}

export interface EditarCarreraRequest {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string;
  id_pensum: number;
}

export interface EditarCarreraResponse {
  exito: boolean;
  mensaje: string;
  carrera?: Carrera;
}

export interface EliminarCarreraRequest {
  id_carrera: number;
}

export interface EliminarCarreraResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCarrerasRequest {
  [key: string]: never;
}

export interface ConsultarCarrerasResponse {
  exito: boolean;
  mensaje: string;
  carreras: Carrera[];
}

export interface CrearPeriodoRequest {
  anio: number;
  num_semestre: number;
}

export interface CrearPeriodoResponse {
  exito: boolean;
  mensaje: string;
  periodo?: Periodo;
}

export interface EditarPeriodoRequest {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface EditarPeriodoResponse {
  exito: boolean;
  mensaje: string;
  periodo?: Periodo;
}

export interface EliminarPeriodoRequest {
  id_periodo: number;
}

export interface EliminarPeriodoResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarPeriodosRequest {
  [key: string]: never;
}

export interface ConsultarPeriodosResponse {
  exito: boolean;
  mensaje: string;
  periodos: Periodo[];
}

export interface CrearPerfilAcademicoRequest {
  id_usuario: number;
  registro_academico: string;
  dpi: string;
  fecha_nacimiento: string;
  telefono: string;
  id_carrera: number;
  direccion: string;
}

export interface CrearPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademico;
}

export interface CambiarPerfilAcademicoRequest {
  id_perfil: number;
  dpi?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  direccion?: string;
  registro_academico?: string;
}

export interface CambiarPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademico;
}

export interface ConsultarPerfilAcademicoRequest {
  id_usuario: number;
}

export interface ConsultarPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademico;
}

export interface ConsultarPerfilesEstudianteRequest {}

export interface ConsultarPerfilesEstudianteResponse {
  exito: boolean;
  mensaje: string;
  perfiles?: PerfilEstudiante[];
}

export interface AsignarRolUsuarioRequest {
  id_usuario: number;
  id_rol: number;
}

export interface AsignarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
}

export interface ComprobarRolUsuarioRequest {
  id_usuario: number;
  nombre_rol: string;
}

export interface ComprobarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
  tiene_rol: boolean;
}

export interface ConsultarRolesUsuarioRequest {
  id_usuario: number;
}

export interface ConsultarRolesUsuarioResponse {
  exito: boolean;
  mensaje: string;
  roles: UsuarioRol[];
}

export interface CambiarRolUsuarioRequest {
  id_usuario: number;
  id_rol_actual: number;
  id_rol_nuevo: number;
}

export interface CambiarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
}

export interface EliminarRolUsuarioRequest {
  id_usuario: number;
  id_rol: number;
}

export interface EliminarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
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
  inscripcion?: Inscripcion;
}

export interface ActualizarEstadoMatriculaRequest {
  id_inscripcion: number;
  nuevo_estado: number;
  usuario_responsable: number;
}

export interface ActualizarEstadoMatriculaResponse {
  exito: boolean;
  mensaje: string;
  inscripcion?: Inscripcion;
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
  registros: CursoEstudiante[];
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
  registros: CursoEstudiante[];
  total_paginas: number;
}

export interface EstadoMatricula {
  id_estado: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface ConsultarEstadosMatriculaRequest {
  [key: string]: never;
}

export interface ConsultarEstadosMatriculaResponse {
  exito: boolean;
  mensaje: string;
  estados: EstadoMatricula[];
}

export interface ConsultarAuditLogsRequest {
  pagina: number;
  usuario_filtro: number;
  tabla_filtro: string;
}

export interface ConsultarAuditLogsResponse {
  exito: boolean;
  mensaje: string;
  registros: AuditLog[];
  total_paginas: number;
}
