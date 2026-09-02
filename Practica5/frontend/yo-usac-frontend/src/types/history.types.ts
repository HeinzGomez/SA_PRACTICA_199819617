import type { ApiResponse, PaginadoResponse } from './api.types'
import type { AuditLog } from './auth.types'

export interface HistorialReproduccion {
  id_historial: number
  id_usuario: number
  id_clase: number
  id_tema: number
  minuto_actual: number
  segundo_actual: number
  duracion_total: number
  porcentaje_visto: number
  fecha_ultima_reproduccion: string
  fecha_creacion: string
  fecha_actualizacion: string
  completada: boolean
}

export interface CheckpointClase {
  id_tema: number
  minuto_actual: number
  segundo_actual: number
  porcentaje_visto: number
  completada: boolean
  fecha_ultima_reproduccion: string
}

export interface EstadisticasUsuario {
  total_clases: number
  clases_completadas: number
  porcentaje_promedio: number
  minutos_vistos: number
}

export interface RegistrarProgresoPayload {
  id_clase: number
  id_tema: number
  minuto_actual: number
  segundo_actual: number
  duracion_total: number
}

export interface ActualizarCheckpointPayload {
  id_clase: number
  id_tema: number
  minuto_actual: number
  segundo_actual: number
}

export interface ConsultarHistorialPayload {
  pagina?: number
}

export type RegistrarProgresoResponse = ApiResponse<{ historial?: HistorialReproduccion }>

export type ActualizarCheckpointResponse = ApiResponse<{ checkpoint?: CheckpointClase }>

export type MarcarClaseCompletadaResponse = ApiResponse<{ historial?: HistorialReproduccion }>

export type ObtenerCheckpointClaseResponse = ApiResponse<{ checkpoint?: CheckpointClase }>

export type EliminarHistorialClaseResponse = ApiResponse

export type ConsultarHistorialResponse = ApiResponse<PaginadoResponse<HistorialReproduccion>>

export type ConsultarEstadisticasResponse = ApiResponse<{ estadisticas?: EstadisticasUsuario }>

export type ConsultarAuditLogsResponse = ApiResponse<PaginadoResponse<AuditLog>>
