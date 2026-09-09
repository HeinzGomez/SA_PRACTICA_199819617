import type { ApiResponse, PaginadoResponse } from './api.types'

export interface Usuario {
  id_usuario: number
  nombre: string
  apellido: string
  correo_institucional: string
  estado: string
  fecha_registro: string
}

export interface Sesion {
  id_sesion: number
  id_usuario: number
  fecha_creacion: string
  fecha_expiracion: string
  estado: string
}

export interface AuditLog {
  id_auditoria: number
  usuario_responsable: number
  operacion: string
  tabla_afectada: string
  fecha_evento: string
  estado_anterior: string
  estado_nuevo: string
}

export interface RegistrarUsuarioPayload {
  nombre: string
  apellido: string
  correo: string
  password: string
}

export interface CrearSesionPayload {
  correo: string
  password: string
}

export interface CambiarPasswordPayload {
  password_actual: string
  password_nueva: string
}

export interface ConsultarAuditLogsPayload {
  pagina: number
  usuario_filtro: number
  tabla_filtro: string
}

export interface IniciarOAuthGoogleResponse {
  exito: boolean
  mensaje: string
  authorization_url: string
}

export interface AutenticarConGoogleResponse {
  exito: boolean
  mensaje: string
  access_token: string
  refresh_token: string
  sesion?: Sesion
  usuario?: Usuario
}

export type RegistrarUsuarioResponse = ApiResponse<{ usuario?: Usuario }>

export type CrearSesionResponse = ApiResponse<{
  access_token: string
  refresh_token: string
  sesion?: Sesion
}>

export type CerrarSesionResponse = ApiResponse

export type CambiarPasswordResponse = ApiResponse

export type ValidarSesionResponse = ApiResponse<{ sesion?: Sesion; usuario?: Usuario }>

export type ConsultarAuditLogsResponse = ApiResponse<PaginadoResponse<AuditLog>>

export type ConsultarUsuarioResponse = ApiResponse<{ usuario?: Usuario }>

export type ConsultarUsuariosResponse = ApiResponse<{ usuarios?: Usuario[] }>
