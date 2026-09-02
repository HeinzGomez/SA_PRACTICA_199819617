export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_institucional: string;
  estado: string;
  fecha_registro: string;
}

export interface Sesion {
  id_sesion: number;
  id_usuario: number;
  fecha_creacion: string;
  fecha_expiracion: string;
  estado: string;
}

export interface AuditLog {
  id_auditoria: number;
  usuario_responsable: number;
  operacion: string;
  tabla_afectada: string;
  fecha_evento: string;
  estado_anterior: string;
  estado_nuevo: string;
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
  usuario?: Usuario;
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
  sesion?: Sesion;
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
  sesion?: Sesion;
  usuario?: Usuario;
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

export interface ConsultarAuditLogsRequest {
  pagina: number;
  usuario_filtro: number;
  tabla_filtro: string;
}

export interface ConsultarAuditLogsResponse {
  exito: boolean;
  mensaje: string;
  registros: AuditLog[];
  total_paginas: number;
}

export interface ConsultarUsuarioRequest {
  id_usuario: number;
}

export interface ConsultarUsuarioResponse {
  exito: boolean;
  mensaje: string;
  usuario?: Usuario;
}

export interface ConsultarUsuariosRequest {}

export interface ConsultarUsuariosResponse {
  exito: boolean;
  mensaje: string;
  usuarios?: Usuario[];
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
  sesion?: Sesion;
  usuario?: Usuario;
}