export interface PensumResponse {
  id_pensum: number;
  nombre: string;
  descripcion: string | null;
}

export interface PeriodoResponse {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface CarreraResponse {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
  fecha_creacion: string;
}

export interface PerfilAcademicoResponse {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  dpi: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  id_carrera: number;
  direccion: string | null;
}

export interface PerfilEstudianteResponse {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  id_carrera: number;
  carrera: string;
  facultad: string;
}

export interface CrearPensumRequest {
  nombre: string;
  descripcion: string;
}

export interface CrearPensumResponse {
  exito: boolean;
  mensaje: string;
  pensum?: PensumResponse;
}

export interface EditarPensumRequest {
  id_pensum: number;
  nombre: string;
  descripcion: string;
}

export interface EditarPensumResponse {
  exito: boolean;
  mensaje: string;
  pensum?: PensumResponse;
}

export interface EliminarPensumRequest {
  id_pensum: number;
}

export interface EliminarPensumResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarPensumsRequest {}

export interface ConsultarPensumsResponse {
  exito: boolean;
  mensaje: string;
  pensums?: PensumResponse[];
}

export interface CrearCarreraRequest {
  facultad: string;
  nombre: string;
  descripcion: string;
  id_pensum: number;
}

export interface CrearCarreraResponse {
  exito: boolean;
  mensaje: string;
  carrera?: CarreraResponse;
}

export interface EditarCarreraRequest {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string;
  id_pensum: number;
}

export interface EditarCarreraResponse {
  exito: boolean;
  mensaje: string;
  carrera?: CarreraResponse;
}

export interface EliminarCarreraRequest {
  id_carrera: number;
}

export interface EliminarCarreraResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCarrerasRequest {}

export interface ConsultarCarrerasResponse {
  exito: boolean;
  mensaje: string;
  carreras?: CarreraResponse[];
}

export interface CrearPeriodoRequest {
  anio: number;
  num_semestre: number;
}

export interface CrearPeriodoResponse {
  exito: boolean;
  mensaje: string;
  periodo?: PeriodoResponse;
}

export interface EditarPeriodoRequest {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface EditarPeriodoResponse {
  exito: boolean;
  mensaje: string;
  periodo?: PeriodoResponse;
}

export interface EliminarPeriodoRequest {
  id_periodo: number;
}

export interface EliminarPeriodoResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarPeriodosRequest {}

export interface ConsultarPeriodosResponse {
  exito: boolean;
  mensaje: string;
  periodos?: PeriodoResponse[];
}

export interface CrearPerfilAcademicoRequest {
  id_usuario: number;
  registro_academico: string;
  dpi: string;
  fecha_nacimiento: string;
  telefono: string;
  id_carrera: number;
  direccion: string;
}

export interface CrearPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademicoResponse;
}

export interface CambiarPerfilAcademicoRequest {
  id_perfil: number;
  dpi?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  direccion?: string;
  registro_academico?: string;
}

export interface CambiarPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademicoResponse;
}

export interface ConsultarPerfilAcademicoRequest {
  id_usuario: number;
}

export interface ConsultarPerfilAcademicoResponse {
  exito: boolean;
  mensaje: string;
  perfil?: PerfilAcademicoResponse;
}

export interface ConsultarPerfilesEstudianteRequest {}

export interface ConsultarPerfilesEstudianteResponse {
  exito: boolean;
  mensaje: string;
  perfiles?: PerfilEstudianteResponse[];
}
