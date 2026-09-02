export interface UsuarioResponse {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_institucional: string;
  estado: string;
  fecha_registro: string;
}

export interface RegistrarUsuarioRequest {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
}

export interface RegistrarUsuarioResponse {
  exito: boolean;
  mensaje: string;
  usuario?: UsuarioResponse;
}

export interface CambiarPasswordRequest {
  id_usuario: number;
  password_actual: string;
  password_nueva: string;
}

export interface CambiarPasswordResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarUsuarioRequest {
  id_usuario: number;
}

export interface ConsultarUsuarioResponse {
  exito: boolean;
  mensaje: string;
  usuario?: UsuarioResponse;
}

export interface ConsultarUsuariosRequest {}

export interface ConsultarUsuariosResponse {
  exito: boolean;
  mensaje: string;
  usuarios?: UsuarioResponse[];
}

export interface IniciarOAuthGoogleRequest {
  state: string;
}

export interface IniciarOAuthGoogleResponse {
  exito: boolean;
  mensaje: string;
  authorization_url: string;
}

export interface AutenticarConGoogleRequest {
  code: string;
  state: string;
}

export interface AutenticarConGoogleResponse {
  exito: boolean;
  mensaje: string;
  access_token: string;
  refresh_token: string;
  sesion?: SesionResponse;
  usuario?: UsuarioResponse;
}

export interface SesionResponse {
  id_sesion: number;
  id_usuario: number;
  fecha_creacion: string;
  fecha_expiracion: string;
  estado: string;
}