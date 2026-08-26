export interface AreaResponse {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface CursoResponse {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  id_area: number;
  fecha_inscripcion: string | null;
}

export interface CrearAreaRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface CrearAreaResponse {
  exito: boolean;
  mensaje: string;
  area?: AreaResponse;
}

export interface EditarAreaRequest {
  id_area: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface EditarAreaResponse {
  exito: boolean;
  mensaje: string;
  area?: AreaResponse;
}

export interface EliminarAreaRequest {
  id_area: number;
}

export interface EliminarAreaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarAreasRequest {
  [key: string]: never;
}

export interface ConsultarAreasResponse {
  exito: boolean;
  mensaje: string;
  areas: AreaResponse[];
}

export interface CrearCursoRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  id_area: number;
}

export interface CrearCursoResponse {
  exito: boolean;
  mensaje: string;
  curso?: CursoResponse;
}

export interface EditarCursoRequest {
  id_curso: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_area: number;
}

export interface EditarCursoResponse {
  exito: boolean;
  mensaje: string;
  curso?: CursoResponse;
}

export interface EliminarCursoRequest {
  id_curso: number;
}

export interface EliminarCursoResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCursosRequest {
  id_area: number;
}

export interface ConsultarCursosResponse {
  exito: boolean;
  mensaje: string;
  cursos: CursoResponse[];
}
