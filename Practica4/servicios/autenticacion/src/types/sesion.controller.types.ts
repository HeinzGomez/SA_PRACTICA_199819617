import { UsuarioResponse } from "./user.controller.types";

export interface SesionResponse {
  id_sesion: number;
  id_usuario: number;
  fecha_creacion: string;
  fecha_expiracion: string;
  estado: string;
}

export interface CrearSesionRequest {
  correo: string;
  password: string;
}

export interface CrearSesionResponse {
  exito: boolean;
  mensaje: string;
  access_token: string;
  refresh_token: string;
  sesion?: SesionResponse;
}

export interface CerrarSesionRequest {
  id_sesion: number;
}

export interface CerrarSesionResponse {
  exito: boolean;
  mensaje: string;
}

export interface ValidarSesionRequest {
  access_token: string;
}

export interface ValidarSesionResponse {
  exito: boolean;
  mensaje: string;
  sesion?: SesionResponse;
  usuario?: UsuarioResponse;
}
