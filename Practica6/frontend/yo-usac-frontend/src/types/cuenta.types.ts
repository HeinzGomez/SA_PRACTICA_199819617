export type CuentaTab = 'informacion' | 'seguridad'

export interface PerfilFormState {
  nombre: string
  apellido: string
  correo: string
  registroAcademico: string
  carrera: string
  dpi: string
  fechaNacimiento: string
  telefono: string
  direccion: string
}

export interface SeguridadFormState {
  passwordActual: string
  nuevaPassword: string
  repetirPassword: string
}

export interface CuentaFormErrors {
  registroAcademico?: string
  dpi?: string
  fechaNacimiento?: string
  telefono?: string
  direccion?: string
  passwordActual?: string
  nuevaPassword?: string
  repetirPassword?: string
  general?: string
}
