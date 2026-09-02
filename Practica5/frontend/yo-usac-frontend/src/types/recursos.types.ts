import type { ApiResponse } from './api.types'

export interface ArchivoRepositorio {
  id_archivo: number
  nombre: string
}

export interface VersionArchivo {
  id_version: number
  id_archivo: number
  link: string
  tag: string
  fecha_creacion: string
  hash: string
  latest: boolean
}

export interface RepositorioInfo {
  id_repositorio: number
  id_clase: number
  nombre: string
  archivos: ArchivoRepositorio[]
}

export interface CrearRepositorioPayload {
  id_clase: number
  nombre: string
}

export interface AgregarArchivoPayload {
  id_repositorio: number
  nombre: string
  link: string
  tag: string
  hash: string
}

export interface ActualizarVersionArchivoPayload {
  link: string
  tag: string
  hash: string
}

export type CrearRepositorioResponse = ApiResponse<{ id_repositorio: number }>

export type AgregarArchivoResponse = ApiResponse<{ id_archivo: number }>

export type ActualizarVersionArchivoResponse = ApiResponse

export type EliminarArchivoResponse = ApiResponse

export type ConsultarRepositorioResponse = ApiResponse<{ repositorio?: RepositorioInfo }>

export type ConsultarVersionesArchivoResponse = ApiResponse<{ versiones: VersionArchivo[] }>

export type ConsultarVersionArchivoResponse = ApiResponse<{ version?: VersionArchivo }>

export type ActualizarTagResponse = ApiResponse

// ─── Apuntes ─────────────────────────────────────────────

export interface MarcadorTiempo {
  id_marcador: number
  segundo: number
  texto: string
}

export interface ApunteInfo {
  id_apunte: number
  id_clase: number
  id_usuario: number
  titulo: string
  contenido_markdown: string
  fecha_creacion: string
  fecha_actualizacion: string
  marcadores: MarcadorTiempo[]
}

export interface ConsultarApuntePayload {
  id_clase: number
  id_usuario: number
}

export interface CrearApuntePayload {
  id_clase: number
  id_usuario: number
  titulo: string
  contenido_markdown: string
}

export interface ActualizarApuntePayload {
  id_apunte: number
  titulo: string
  contenido_markdown: string
}

export interface AgregarMarcadorTiempoPayload {
  id_apunte: number
  segundo: number
  texto: string
}

export type ConsultarApunteResponse = ApiResponse<{ apunte?: ApunteInfo }>

export type CrearApunteResponse = ApiResponse<{ id_apunte: number }>

export type ActualizarApunteResponse = ApiResponse

export type AgregarMarcadorTiempoResponse = ApiResponse<{ id_marcador: number }>

export type EliminarMarcadorTiempoResponse = ApiResponse
