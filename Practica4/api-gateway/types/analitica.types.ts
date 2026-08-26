export interface Unidad {
  id_unidad: number;
  nombre: string;
  descripcion: string;
}

export interface Tema {
  id_tema: number;
  id_unidad: number;
  nombre: string;
  descripcion: string;
  unidad: string;
}

export interface ClaseGrabada {
  id_clase: number;
  id_curso: number;
  id_periodo: number;
  id_area: number;
  titulo: string;
  fecha_impartida: string;
  duracion_min: number;
  descripcion: string;
  url_video: string;
  anio: number;
  num_semestre: number;
}

export interface CatalogoClase {
  id_clase: number;
  titulo: string;
  descripcion: string;
  fecha_impartida: string;
  duracion_min: number;
  url_video: string;
  anio: number;
  num_semestre: number;
  id_curso: number;
  id_area: number;
  id_periodo: number;
}

export interface ClaseVista {
  id_clase: number;
  titulo: string;
  total_visualizaciones: number;
}

export interface TemaTendencia {
  id_tema: number;
  nombre: string;
  unidad: string;
  total_visualizaciones: number;
}

export interface ClaseValorada {
  id_clase: number;
  titulo: string;
  promedio_calificacion: number;
  total_calificaciones: number;
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

// ── Unidades ─────────────────────────────────────
export interface CrearUnidadRequest {
  nombre: string;
  descripcion: string;
}

export interface CrearUnidadResponse {
  exito: boolean;
  mensaje: string;
  unidad?: Unidad;
}

export interface EditarUnidadRequest {
  id_unidad: number;
  nombre: string;
  descripcion: string;
}

export interface EditarUnidadResponse {
  exito: boolean;
  mensaje: string;
  unidad?: Unidad;
}

export interface EliminarUnidadRequest {
  id_unidad: number;
}

export interface EliminarUnidadResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarUnidadesRequest {
  [key: string]: never;
}

export interface ConsultarUnidadesResponse {
  exito: boolean;
  mensaje: string;
  unidades: Unidad[];
}

// ── Temas ────────────────────────────────────────
export interface CrearTemaRequest {
  id_unidad: number;
  nombre: string;
  descripcion: string;
}

export interface CrearTemaResponse {
  exito: boolean;
  mensaje: string;
  tema?: Tema;
}

export interface EditarTemaRequest {
  id_tema: number;
  id_unidad: number;
  nombre: string;
  descripcion: string;
}

export interface EditarTemaResponse {
  exito: boolean;
  mensaje: string;
  tema?: Tema;
}

export interface EliminarTemaRequest {
  id_tema: number;
}

export interface EliminarTemaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarTemasRequest {
  id_unidad: number;
}

export interface ConsultarTemasResponse {
  exito: boolean;
  mensaje: string;
  temas: Tema[];
}

// ── Clases grabadas ──────────────────────────────
export interface CrearClaseGrabadaRequest {
  id_curso: number;
  id_periodo: number;
  id_area: number;
  titulo: string;
  fecha_impartida: string;
  duracion_min: number;
  descripcion: string;
  url_video: string;
  anio: number;
  num_semestre: number;
}

export interface CrearClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
  clase?: ClaseGrabada;
}

export interface EditarClaseGrabadaRequest {
  id_clase: number;
  id_curso: number;
  id_periodo: number;
  id_area: number;
  titulo: string;
  fecha_impartida: string;
  duracion_min: number;
  descripcion: string;
  url_video: string;
  anio: number;
  num_semestre: number;
}

export interface EditarClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
  clase?: ClaseGrabada;
}

export interface EliminarClaseGrabadaRequest {
  id_clase: number;
}

export interface EliminarClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCatalogoClasesRequest {
  [key: string]: never;
}

export interface ConsultarCatalogoClasesResponse {
  exito: boolean;
  mensaje: string;
  registros: CatalogoClase[];
}

export interface AsignarTemaClaseGrabadaRequest {
  id_clase: number;
  id_tema: number;
}

export interface AsignarTemaClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
}

export interface DesasignarTemaClaseGrabadaRequest {
  id_clase: number;
  id_tema: number;
}

export interface DesasignarTemaClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ClaseCargaInput {
  id_curso: number;
  id_periodo: number;
  id_area: number;
  titulo: string;
  fecha_impartida: string;
  duracion_min: number;
  descripcion?: string;
  url_video?: string;
  anio?: number;
  num_semestre?: number;
}

export interface BatchCrearClaseResult {
  index: number;
  exito: boolean;
  mensaje: string;
  id_clase: number;
}

export interface BatchCrearClaseRequest {
  clases: ClaseCargaInput[];
}

export interface BatchCrearClaseResponse {
  exito: boolean;
  mensaje: string;
  resultados: BatchCrearClaseResult[];
}

// ── Analítica: acciones de usuarios ──────────────
export interface VisualizarClaseRequest {
  id_clase: number;
  id_usuario: number;
}

export interface VisualizarClaseResponse {
  exito: boolean;
  mensaje: string;
  clase?: ClaseVista;
}

export interface CalificarClaseRequest {
  id_clase: number;
  puntuacion: number;
  id_usuario: number;
}

export interface CalificarClaseResponse {
  exito: boolean;
  mensaje: string;
  promedio_calificacion: number;
}

export interface ConsultarCalificacionUsuarioRequest {
  id_clase: number;
  id_usuario: number;
}

export interface ConsultarCalificacionUsuarioResponse {
  exito: boolean;
  mensaje: string;
  ya_califico: boolean;
  puntuacion: number;
  promedio_calificacion: number;
  total_calificaciones: number;
}

// ── Analítica: tendencias ────────────────────────
export interface ConsultarClasesMasVistasRequest {
  fecha_inicio: string;
  fecha_fin: string;
  limite: number;
}

export interface ConsultarClasesMasVistasResponse {
  exito: boolean;
  mensaje: string;
  registros: ClaseVista[];
}

export interface ConsultarTemasTendenciaRequest {
  fecha_inicio: string;
  fecha_fin: string;
  limite: number;
}

export interface ConsultarTemasTendenciaResponse {
  exito: boolean;
  mensaje: string;
  registros: TemaTendencia[];
}

export interface ConsultarRankingValoradasRequest {
  limite: number;
}

export interface ConsultarRankingValoradasResponse {
  exito: boolean;
  mensaje: string;
  registros: ClaseValorada[];
}

// ── Auditoría ────────────────────────────────────
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
