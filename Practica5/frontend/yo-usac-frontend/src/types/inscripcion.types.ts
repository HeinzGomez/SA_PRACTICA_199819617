import type { ApiResponse } from './api.types'
import type { AuditLog } from './auth.types'

export interface Area {
  id_area: number
  codigo: string
  nombre: string
  descripcion: string
}

export interface Curso {
  id_curso: number
  codigo: string
  nombre: string
  descripcion: string
  id_area: number
  fecha_inscripcion: string
}

export interface Pensum {
  id_pensum: number
  nombre: string
  descripcion: string
}

export interface Periodo {
  id_periodo: number
  anio: number
  num_semestre: number
}

export interface Carrera {
  id_carrera: number
  facultad: string
  nombre: string
  descripcion: string
  id_pensum: number
  fecha_creacion: string
}

export interface PerfilAcademico {
  id_perfil: number
  id_usuario: number
  registro_academico: string
  dpi: string
  fecha_nacimiento: string
  telefono: string
  id_carrera: number
  direccion: string
}

export interface UsuarioRol {
  id_usuario: number
  id_rol: number
  rol: string
  descripcion: string
}

export interface Inscripcion {
  id_inscripcion: number
  id_usuario: number
  id_curso: number
  id_periodo: number
  id_estado_matricula: number
  fecha_inscripcion: string
  tipo_inscripcion: string
}

export interface CursoEstudiante {
  id_inscripcion: number
  id_usuario: number
  id_curso: number
  codigo_curso: string
  curso: string
  codigo_area: string
  area: string
  anio: number
  semestre: number
  codigo_estado: string
  estado_matricula: string
  tipo_inscripcion: string
  fecha_inscripcion: string
}

export interface PerfilEstudiante {
  id_perfil: number
  id_usuario: number
  registro_academico: string
  id_carrera: number
  carrera: string
  facultad: string
}

export interface EstadoMatricula {
  id_estado: number
  codigo: string
  nombre: string
  descripcion: string
}

export interface CrearAreaPayload {
  codigo: string
  nombre: string
  descripcion: string
}

export interface EditarAreaPayload {
  id_area: number
  codigo: string
  nombre: string
  descripcion: string
}

export interface CrearCursoPayload {
  codigo: string
  nombre: string
  descripcion: string
  id_area: number
}

export interface EditarCursoPayload {
  id_curso: number
  codigo: string
  nombre: string
  descripcion: string
  id_area: number
}

export interface CrearPensumPayload {
  nombre: string
  descripcion: string
}

export interface EditarPensumPayload {
  id_pensum: number
  nombre: string
  descripcion: string
}

export interface EliminarPensumResponse {
  exito: boolean
  mensaje: string
}

export interface CrearPeriodoPayload {
  anio: number
  num_semestre: number
}

export interface EditarPeriodoPayload {
  id_periodo: number
  anio: number
  num_semestre: number
}

export interface EliminarPeriodoResponse {
  exito: boolean
  mensaje: string
}

export interface CrearCarreraPayload {
  facultad: string
  nombre: string
  descripcion: string
  id_pensum: number
}

export interface EditarCarreraPayload {
  id_carrera: number
  facultad: string
  nombre: string
  descripcion: string
  id_pensum: number
}

export interface CrearPerfilPayload {
  id_usuario: number
  registro_academico: string
  dpi: string
  fecha_nacimiento: string
  telefono: string
  id_carrera: number
  direccion: string
}

export interface CambiarPerfilPayload {
  id_perfil: number
  dpi?: string
  fecha_nacimiento?: string
  telefono?: string
  direccion?: string
  registro_academico?: string
}

export interface AsignarRolPayload {
  id_usuario: number
  id_rol: number
}

export interface CambiarRolPayload {
  id_usuario: number
  id_rol_actual: number
  id_rol_nuevo: number
}

export interface ComprobarRolPayload {
  id_usuario: number
  nombre_rol: string
}

export interface EliminarRolPayload {
  id_usuario: number
  id_rol: number
}

export interface InscribirEstudiantePayload {
  id_usuario: number
  id_curso: number
  id_periodo: number
  id_estado_matricula: number
  tipo_inscripcion: string
}

export interface ActualizarEstadoMatriculaPayload {
  id_inscripcion: number
  nuevo_estado: number
}

export interface ConsultarCursosEstudiantePayload {
  id_usuario: number
  anio: number
  semestre: number
  estado: string
  pagina?: number
}

export interface ConsultarTodasInscripcionesPayload {
  id_curso?: number
  anio?: number
  semestre?: number
  pagina?: number
}

export type CrearAreaResponse = ApiResponse<{ area?: Area }>

export type EditarAreaResponse = ApiResponse<{ area?: Area }>

export type EliminarAreaResponse = ApiResponse<object>

export type CrearCursoResponse = ApiResponse<{ curso?: Curso }>

export type EditarCursoResponse = ApiResponse<{ curso?: Curso }>

export type EliminarCursoResponse = ApiResponse<object>

export type ConsultarAreasResponse = ApiResponse<{ areas: Area[] }>

export type ConsultarCursosResponse = ApiResponse<{ cursos: Curso[] }>

export type CrearPensumResponse = ApiResponse<{ pensum?: Pensum }>

export type EditarPensumResponse = ApiResponse<{ pensum?: Pensum }>

export type ConsultarPensumsResponse = ApiResponse<{ pensums: Pensum[] }>

export type CrearPeriodoResponse = ApiResponse<{ periodo?: Periodo }>

export type EditarPeriodoResponse = ApiResponse<{ periodo?: Periodo }>

export type ConsultarPeriodosResponse = ApiResponse<{ periodos: Periodo[] }>

export type CrearCarreraResponse = ApiResponse<{ carrera?: Carrera }>

export type EditarCarreraResponse = ApiResponse<{ carrera?: Carrera }>

export type EliminarCarreraResponse = ApiResponse<object>

export type ConsultarCarrerasResponse = ApiResponse<{ carreras: Carrera[] }>

export type CrearPerfilResponse = ApiResponse<{ perfil?: PerfilAcademico }>

export type CambiarPerfilResponse = ApiResponse<{ perfil?: PerfilAcademico }>

export type ConsultarPerfilResponse = ApiResponse<{ perfil?: PerfilAcademico }>

export type ConsultarPerfilesEstudianteResponse = ApiResponse<{
  perfiles?: PerfilEstudiante[]
}>

export type AsignarRolResponse = ApiResponse

export type CambiarRolResponse = ApiResponse

export type EliminarRolResponse = ApiResponse

export type ComprobarRolResponse = ApiResponse<{ tiene_rol: boolean }>

export type ConsultarRolesUsuarioResponse = ApiResponse<{ roles: UsuarioRol[] }>

export type InscribirEstudianteResponse = ApiResponse<{ inscripcion?: Inscripcion }>

export type ActualizarEstadoMatriculaResponse = ApiResponse<{ inscripcion?: Inscripcion }>

export type ConsultarCursosEstudianteResponse = ApiResponse<{
  registros: CursoEstudiante[]
  total_paginas: number
}>

export type ConsultarTodasInscripcionesResponse = ApiResponse<{
  registros: CursoEstudiante[]
  total_paginas: number
}>

export type ConsultarEstadosMatriculaResponse = ApiResponse<{ estados: EstadoMatricula[] }>

export type ConsultarAuditLogsResponse = ApiResponse<{
  registros: AuditLog[]
  total_paginas: number
}>
