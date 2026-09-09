export interface CrearAreaParams {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface EditarAreaParams {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface AreaRow {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCursoParams {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
}

export interface EditarCursoParams {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
}

export interface CursoRow {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
  fecha_inscripcion: Date | null;
}

export interface ListarCursosParams {
  idArea?: number;
}
