export interface CrearPensumInput {
  nombre: string;
  descripcion: string | null;
}

export interface CrearPeriodoInput {
  anio: number;
  num_semestre: number;
}

export interface EditarPeriodoInput {
  id_periodo: number;
  anio: number;
  num_semestre: number;
}

export interface EditarPensumInput {
  id_pensum: number;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCarreraInput {
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
}

export interface EditarCarreraInput {
  id_carrera: number;
  facultad: string;
  nombre: string;
  descripcion: string | null;
  id_pensum: number;
}

export interface CrearPerfilAcademicoInput {
  id_usuario: number;
  registro_academico: string | null;
  dpi: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  id_carrera: number | null;
  direccion: string | null;
}

export interface CambiarPerfilAcademicoInput {
  id_perfil: number;
  dpi?: string | null;
  fecha_nacimiento?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  registro_academico?: string | null;
}
