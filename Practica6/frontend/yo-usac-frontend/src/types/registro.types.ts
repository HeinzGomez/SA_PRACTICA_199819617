export interface RegisterFormData {
  nombre: string
  apellido: string
  correo: string
  password: string
  confirmPassword?: string
  dpi: string
  fechaNacimiento: string
  carnet: string // registro_academico
  telefono: string
  direccion: string
  carrera: string // id_carrera or carrera name
}

export interface RegisterFormErrors {
  nombre?: string
  apellido?: string
  correo?: string
  password?: string
  confirmPassword?: string
  dpi?: string
  fechaNacimiento?: string
  carnet?: string
  telefono?: string
  direccion?: string
  carrera?: string
  general?: string
}

export interface CarreraOption {
  id: string | number
  nombre: string
}
