import type { ApiResponse, PaginadoResponse } from './api.types'
import type { AuditLog } from './auth.types'

export interface Unidad {
  id_unidad: number
  nombre: string
  descripcion: string
}

export interface Tema {
  id_tema: number
  id_unidad: number
  nombre: string
  descripcion: string
  unidad?: string
}

export interface ClaseGrabada {
  id_clase: number
  id_curso: number
  id_periodo: number
  id_area: number
  titulo: string
  fecha_impartida: string
  duracion_min: number
  descripcion: string
  url_video: string
  anio: number
  num_semestre: number
}

export interface CatalogoClase {
  id_clase: number
  titulo: string
  descripcion: string
  fecha_impartida: string
  duracion_min: number
  url_video: string
  anio: number
  num_semestre: number
  id_curso: number
  id_area: number
  id_periodo: number
}

export interface ClaseVista {
  id_clase: number
  titulo: string
  total_visualizaciones: number
}

export interface TemaTendencia {
  id_tema: number
  nombre: string
  unidad: string
  total_visualizaciones: number
}

export interface ClaseValorada {
  id_clase: number
  titulo: string
  promedio_calificacion: number
  total_calificaciones: number
}

export interface CrearUnidadPayload {
  nombre: string
  descripcion: string
}

export interface EditarUnidadPayload {
  id_unidad: number
  nombre: string
  descripcion: string
}

export interface CrearTemaPayload {
  id_unidad: number
  nombre: string
  descripcion: string
}

export interface EditarTemaPayload {
  id_tema: number
  id_unidad: number
  nombre: string
  descripcion: string
}

export interface ConsultarTemasPayload {
  id_unidad?: number
}

export interface CrearClaseGrabadaPayload {
  id_curso: number
  id_periodo: number
  id_area: number
  titulo: string
  fecha_impartida: string
  duracion_min: number
  descripcion: string
  url_video: string
  anio: number
  num_semestre: number
}

export interface EditarClaseGrabadaPayload {
  id_clase: number
  id_curso: number
  id_periodo: number
  id_area: number
  titulo: string
  fecha_impartida: string
  duracion_min: number
  descripcion: string
  url_video: string
  anio: number
  num_semestre: number
}

export interface AsignarTemaClaseGrabadaPayload {
  id_clase: number
  id_tema: number
}

export interface ClaseCargaInput {
  id_curso: number
  id_periodo: number
  id_area: number
  titulo: string
  fecha_impartida: string
  duracion_min: number
  descripcion?: string
  url_video?: string
  anio?: number
  num_semestre?: number
}

export interface BatchCrearClaseResult {
  index: number
  exito: boolean
  mensaje?: string
  id_clase?: number
}

export type CargaMasivaClasesPayload = ClaseCargaInput[]

export type CargaMasivaClasesResponse = ApiResponse<{ resultados: BatchCrearClaseResult[] }>

export type DesasignarTemaClaseGrabadaResponse = ApiResponse

export interface VisualizarClasePayload {
  id_clase: number
  id_usuario?: number
}

export interface CalificarClasePayload {
  id_clase: number
  puntuacion: number
  id_usuario?: number
}

export interface CalificacionUsuario {
  ya_califico: boolean
  puntuacion: number
  promedio_calificacion: number
  total_calificaciones: number
}

export interface ConsultarTendenciasPayload {
  fecha_inicio?: string
  fecha_fin?: string
  limite?: number
}

export interface ConsultarAuditLogsPayload {
  pagina?: number
  usuario_filtro?: number
  tabla_filtro?: string
}

export type CrearUnidadResponse = ApiResponse<{ unidad?: Unidad }>

export type EditarUnidadResponse = ApiResponse<{ unidad?: Unidad }>

export type EliminarUnidadResponse = ApiResponse

export type ConsultarUnidadesResponse = ApiResponse<{ unidades: Unidad[] }>

export type CrearTemaResponse = ApiResponse<{ tema?: Tema }>

export type EditarTemaResponse = ApiResponse<{ tema?: Tema }>

export type EliminarTemaResponse = ApiResponse

export type ConsultarTemasResponse = ApiResponse<{ temas: Tema[] }>

export type CrearClaseGrabadaResponse = ApiResponse<{ clase?: ClaseGrabada }>

export type EditarClaseGrabadaResponse = ApiResponse<{ clase?: ClaseGrabada }>

export type EliminarClaseGrabadaResponse = ApiResponse

export type ConsultarCatalogoClasesResponse = ApiResponse<{ registros: CatalogoClase[] }>

export type AsignarTemaClaseGrabadaResponse = ApiResponse

export type VisualizarClaseResponse = ApiResponse<{ clase?: ClaseVista }>

export type CalificarClaseResponse = ApiResponse<{ promedio_calificacion: number }>

export type ConsultarCalificacionUsuarioResponse = ApiResponse<
  Partial<CalificacionUsuario>
>

export type ConsultarClasesMasVistasResponse = ApiResponse<{ registros: ClaseVista[] }>

export type ConsultarTemasTendenciaResponse = ApiResponse<{ registros: TemaTendencia[] }>

export type ConsultarRankingValoradasResponse = ApiResponse<{ registros: ClaseValorada[] }>

export type ConsultarAuditLogsResponse = ApiResponse<PaginadoResponse<AuditLog>>
