export interface CrearPensumParams {
  nombre: string;
  descripcion: string | null;
}

export interface CrearPeriodoParams {
  anio: number;
  num_semestre: number;
}

export interface EditarPeriodoParams {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface PeriodoRow {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface EditarPensumParams {
  id_pensum: number;
  nombre: string;
  descripcion: string | null;
}

export interface PensumRow {
  id_pensum: number;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCarreraParams {
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
}

export interface EditarCarreraParams {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
}

export interface CarreraRow {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
  fecha_creacion: Date;
}

export interface CrearPerfilAcademicoParams {
  id_usuario: number;
  registro_academico: string | null;
  dpi: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  id_carrera: number | null;
  direccion: string | null;
}

export interface CambiarPerfilAcademicoParams {
  id_perfil: number;
  dpi: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  registro_academico: string | null;
}

export interface PerfilAcademicoRow {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  dpi: string;
  fecha_nacimiento: Date | null;
  telefono: string | null;
  id_carrera: number;
  direccion: string | null;
}

export interface PerfilEstudianteRow {
  id_perfil: number;
  id_usuario: number;
  registro_academico: string;
  id_carrera: number;
  carrera: string;
  facultad: string;
}
