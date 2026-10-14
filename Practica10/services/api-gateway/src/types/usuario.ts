// HeinzGomez - Práctica 9: estructuras de sesión que viajan entre el Gateway y auth-service.
export type Rol = 'ESTUDIANTE' | 'ADMINISTRADOR';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  carnet: string;
  correo: string;
  rol: Rol;
}

export interface Registro {
  nombre: string;
  carnet: string;
  correo: string;
  password: string;
}

export interface Credenciales {
  correo: string;
  password: string;
}

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

export interface Validacion {
  valido: boolean;
  usuario?: UsuarioSesion;
}

declare module 'express-serve-static-core' {
  interface Request { usuario?: UsuarioSesion }
}
