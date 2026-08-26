export interface CrearAreaInput {
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface EditarAreaInput {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCursoInput {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
}

export interface EditarCursoInput {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
}

export interface ConsultarCursosInput {
  id_area?: number;
}
