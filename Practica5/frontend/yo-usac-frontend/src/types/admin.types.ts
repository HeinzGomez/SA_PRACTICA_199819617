export interface ClaseMasVista {
  id: number
  titulo: string
  total_vistas?: number
}

export interface TemaTendencia {
  id: number
  nombre: string
  total_consultas?: number
}

export interface ClaseValorada {
  id: number
  clase: string
  curso: string
  catedratico: string
  calificacion: number
}

export type AdminTab = 
  | 'analitica' 
  | 'usuarios' 
  | 'catalogo' 
  | 'inscripciones' 
  | 'clases' 
  | 'audit'

export interface UserRoleItem {
  id_usuario: number
  nombre: string
  correo: string
  rol: string
}

export interface InscripcionItem {
  id_inscripcion: number
  id_usuario: number
  usuario_nombre?: string
  id_curso: number
  curso_nombre?: string
  codigo_curso?: string
  anio: number
  semestre: string
  estado: string
  fecha_inscripcion?: string
}

export interface AreaItem {
  id_area: number
  codigo?: string
  nombre: string
  descripcion?: string
}

export interface CursoItem {
  id_curso: number
  codigo: string
  nombre: string
  creditos?: number
  id_area?: number
  area_nombre?: string
}

export interface CarreraItem {
  id_carrera: number
  nombre: string
}

export interface PensumItem {
  id_pensum: number
  nombre: string
  descripcion?: string
}

export interface PeriodoItem {
  id_periodo: number
  anio: number
  num_semestre: number
}

export interface UnidadItem {
  id_unidad: number
  nombre: string
  descripcion?: string
}

export interface TemaItem {
  id_tema: number
  nombre: string
  id_unidad: number
  unidad_nombre?: string
}

export interface ClaseGrabadaItem {
  id_clase: number
  titulo: string
  descripcion: string
  id_curso: number
  curso_nombre?: string
  id_catedratico?: number
  catedratico_nombre?: string
  id_auxiliar?: number
  auxiliar_nombre?: string
  id_area?: number
  id_periodo?: number
  fecha_impartida?: string
  duracion_min?: number
  url_video?: string
  fecha_publicacion?: string
  anio?: number
  num_semestre?: number
}
