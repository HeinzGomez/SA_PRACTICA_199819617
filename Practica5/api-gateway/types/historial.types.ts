export interface HistorialReproduccion {
  id_historial: number;
  id_usuario: number;
  id_clase: number;
  id_tema: number;
  minuto_actual: number;
  segundo_actual: number;
  duracion_total: number;
  porcentaje_visto: number;
  fecha_ultima_reproduccion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  completada: boolean;
}

export interface CheckpointClase {
  id_tema: number;
  minuto_actual: number;
  segundo_actual: number;
  porcentaje_visto: number;
  completada: boolean;
  fecha_ultima_reproduccion: string;
}

export interface EstadisticasUsuario {
  total_clases: number;
  clases_completadas: number;
  porcentaje_promedio: number;
  minutos_vistos: number;
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

export interface RegistrarProgresoRequest {
  id_usuario: number;
  id_clase: number;
  id_tema: number;
  minuto_actual: number;
  segundo_actual: number;
  duracion_total: number;
}

export interface RegistrarProgresoResponse {
  exito: boolean;
  mensaje: string;
  historial?: HistorialReproduccion;
}

export interface ActualizarCheckpointRequest {
  id_usuario: number;
  id_clase: number;
  id_tema: number;
  minuto_actual: number;
  segundo_actual: number;
}

export interface ActualizarCheckpointResponse {
  exito: boolean;
  mensaje: string;
  checkpoint?: CheckpointClase;
}

export interface MarcarClaseCompletadaRequest {
  id_usuario: number;
  id_clase: number;
}

export interface MarcarClaseCompletadaResponse {
  exito: boolean;
  mensaje: string;
  historial?: HistorialReproduccion;
}

export interface ObtenerCheckpointClaseRequest {
  id_usuario: number;
  id_clase: number;
}

export interface ObtenerCheckpointClaseResponse {
  exito: boolean;
  mensaje: string;
  checkpoint?: CheckpointClase;
}

export interface ConsultarHistorialUsuarioRequest {
  id_usuario: number;
  pagina: number;
}

export interface ConsultarHistorialUsuarioResponse {
  exito: boolean;
  mensaje: string;
  registros: HistorialReproduccion[];
  total_paginas: number;
}

export interface ConsultarEstadisticasUsuarioRequest {
  id_usuario: number;
}

export interface ConsultarEstadisticasUsuarioResponse {
  exito: boolean;
  mensaje: string;
  estadisticas?: EstadisticasUsuario;
}

export interface EliminarHistorialClaseRequest {
  id_usuario: number;
  id_clase: number;
}

export interface EliminarHistorialClaseResponse {
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
