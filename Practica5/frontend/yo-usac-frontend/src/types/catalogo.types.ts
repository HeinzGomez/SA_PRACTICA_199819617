export interface FiltrosCatalogo {
  anio: string
  semestre: string
  area: string
  curso: string
}

export interface OpcionFiltro {
  value: string
  label: string
}

export interface ClaseCardItem {
  id_clase: number
  cursoNombre: string
  temaNombre: string
  periodoTexto: string
  thumbnailUrl?: string
  catedraticoNombre?: string
}