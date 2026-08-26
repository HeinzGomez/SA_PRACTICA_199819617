export interface ApiErrorResponse {
  exito: boolean
  mensaje: string
}

export type ApiResponse<TData extends object = object> = ApiErrorResponse & TData

export interface PaginadoResponse<TItem extends object> {
  registros: TItem[]
  total_paginas: number
}
