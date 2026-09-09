import type { ApiResponse, PaginadoResponse } from './api.types'
import type { AuditLog } from './auth.types'

export interface Notificacion {
  id_notificacion: number
  id_usuario: number
  tipo: string
  asunto: string
  mensaje: string
  fecha_envio: string
  estado: string
}

export interface EnviarNotificacionRegistroPayload {
  correo: string
  nombre_usuario: string
}

export interface EnviarNotificacionContenidoNuevoPayload {
  correos: string[]
  titulo_contenido: string
  descripcion: string
}

export interface EnviarNotificacionAvisoGeneralPayload {
  correo: string
  asunto: string
  mensaje: string
}

export interface ConsultarNotificacionesPayload {
  pagina?: number
}

export interface ConsultarAuditLogsPayload {
  pagina?: number
  usuario_filtro?: number
  tabla_filtro?: string
}

export type EnviarNotificacionRegistroResponse = ApiResponse<{ notificacion?: Notificacion }>

export type EnviarNotificacionContenidoNuevoResponse = ApiResponse<{
  destinatarios: number
  notificaciones: Notificacion[]
}>

export type EnviarNotificacionAvisoGeneralResponse = ApiResponse<{ notificacion?: Notificacion }>

export type ConsultarNotificacionesResponse = ApiResponse<PaginadoResponse<Notificacion>>

export type ConsultarAuditLogsResponse = ApiResponse<PaginadoResponse<AuditLog>>
