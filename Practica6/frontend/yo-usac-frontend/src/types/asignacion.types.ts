export interface FiltrosAsignacion {
  anio: string
  semestre: string
  estadoMatriculacion: string
}

export interface AsignacionItem {
  id_inscripcion: number
  curso: string
  seccion: string
  catedratico: string
  estadoMatriculacion: 'Matriculado' | 'Pendiente' | 'No Asignado' | string
  anio?: number
  semestre?: number
}
