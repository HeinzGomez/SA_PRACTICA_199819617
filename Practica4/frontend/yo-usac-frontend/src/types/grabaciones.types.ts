import type { ApiResponse } from './api.types'
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

export interface MaterialApoyo {
  id_material: number
  id_clase: number
  nombre: string
  tipo: string
  url: string
}

export interface Participante {
  id_clase: number
  id_usuario: number
  tipo_participante: string
}

export interface DetalleClaseGrabada {
  clase: ClaseGrabada
  temas: Tema[]
  materiales: MaterialApoyo[]
  participantes: Participante[]
}

export interface CrearUnidadPayload {
  nombre: string
  descripcion: string
}

export interface EditarUnidadPayload {
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
  id_unidad: number
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

export interface BusquedaAvanzadaPayload {
  anio: number
  semestre: number
  id_area: number
  id_curso: number
  id_docente: number
  id_tema: number
  pagina: number
}

export interface AsignarMaterialApoyoPayload {
  nombre: string
  tipo: string
  url: string
}

export type ConsultarCatalogoClasesResponse = ApiResponse<{
  registros: CatalogoClase[]
  total_paginas: number
}>

export type BusquedaAvanzadaResponse = ApiResponse<{
  registros: CatalogoClase[]
  total_paginas: number
}>

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

export type ObtenerDetalleClaseGrabadaResponse = ApiResponse<{ detalle?: DetalleClaseGrabada }>

export type ObtenerEnlaceClaseGrabadaResponse = ApiResponse<{ url_video: string }>

export type AsignarDocenteResponse = ApiResponse

export type AsignarAuxiliarResponse = ApiResponse

export type DesasignarDocenteResponse = ApiResponse

export type DesasignarAuxiliarResponse = ApiResponse

export type DesasignarMaterialApoyoResponse = ApiResponse

export type DesasignarTemaClaseGrabadaResponse = ApiResponse

export type AsignarMaterialApoyoResponse = ApiResponse<{ material?: MaterialApoyo }>

export type AsignarTemaClaseGrabadaResponse = ApiResponse

export type ConsultarParticipantesClaseResponse = ApiResponse<{ participantes: Participante[] }>

export type ConsultarAuditLogsResponse = ApiResponse<{
  registros: AuditLog[]
  total_paginas: number
}>

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

export type BatchCrearClaseResponse = ApiResponse<{ resultados: BatchCrearClaseResult[] }>
