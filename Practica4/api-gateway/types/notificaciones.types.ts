export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  tipo: string;
  asunto: string;
  mensaje: string;
  fecha_envio: string;
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

export interface EnviarNotificacionRegistroRequest {
  id_usuario: number;
  correo: string;
  nombre_usuario: string;
}

export interface EnviarNotificacionRegistroResponse {
  exito: boolean;
  mensaje: string;
  notificacion?: Notificacion;
}

export interface EnviarNotificacionContenidoNuevoRequest {
  id_usuario: number;
  correos: string[];
  titulo_contenido: string;
  descripcion: string;
}

export interface EnviarNotificacionContenidoNuevoResponse {
  exito: boolean;
  mensaje: string;
  destinatarios: number;
  notificaciones: Notificacion[];
}

export interface EnviarNotificacionAvisoGeneralRequest {
  id_usuario: number;
  correo: string;
  asunto: string;
  mensaje: string;
}

export interface EnviarNotificacionAvisoGeneralResponse {
  exito: boolean;
  mensaje: string;
  notificacion?: Notificacion;
}

export interface ConsultarNotificacionesRequest {
  id_usuario: number;
  pagina: number;
}

export interface ConsultarNotificacionesResponse {
  exito: boolean;
  mensaje: string;
  registros: Notificacion[];
  total_paginas: number;
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
