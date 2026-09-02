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
  unidad?: string;
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

export interface MaterialApoyo {
  id_material: number;
  id_clase: number;
  nombre: string;
  tipo: string;
  url: string;
}

export interface Participante {
  id_clase: number;
  id_usuario: number;
  tipo_participante: string;
}

export interface DetalleClaseGrabada {
  clase: ClaseGrabada;
  temas: Tema[];
  materiales: MaterialApoyo[];
  participantes: Participante[];
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

export interface ConsultarUnidadesRequest { }

export interface ConsultarUnidadesResponse {
  exito: boolean;
  mensaje: string;
  unidades: Unidad[];
}

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

export interface BusquedaAvanzadaRequest {
  anio: number;
  semestre: number;
  id_area: number;
  id_curso: number;
  id_docente: number;
  id_tema: number;
  pagina: number;
}

export interface BusquedaAvanzadaResponse {
  exito: boolean;
  mensaje: string;
  registros: CatalogoClase[];
  total_paginas: number;
}

export interface ConsultarCatalogoClasesRequest {
  pagina: number;
}

export interface ConsultarCatalogoClasesResponse {
  exito: boolean;
  mensaje: string;
  registros: CatalogoClase[];
  total_paginas: number;
}

export interface ObtenerDetalleClaseGrabadaRequest {
  id_clase: number;
}

export interface ObtenerDetalleClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
  detalle?: DetalleClaseGrabada;
}

export interface ObtenerEnlaceClaseGrabadaRequest {
  id_clase: number;
}

export interface ObtenerEnlaceClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
  url_video: string;
}

export interface AsignarDocenteRequest {
  id_clase: number;
  id_usuario: number;
}

export interface AsignarDocenteResponse {
  exito: boolean;
  mensaje: string;
}

export interface AsignarAuxiliarRequest {
  id_clase: number;
  id_usuario: number;
}

export interface AsignarAuxiliarResponse {
  exito: boolean;
  mensaje: string;
}

export interface AsignarMaterialApoyoRequest {
  id_clase: number;
  nombre: string;
  tipo: string;
  url: string;
}

export interface AsignarMaterialApoyoResponse {
  exito: boolean;
  mensaje: string;
  material?: MaterialApoyo;
}

export interface AsignarTemaClaseGrabadaRequest {
  id_clase: number;
  id_tema: number;
}

export interface AsignarTemaClaseGrabadaResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarParticipantesClaseRequest {
  id_clase: number;
}

export interface ConsultarParticipantesClaseResponse {
  exito: boolean;
  mensaje: string;
  participantes: Participante[];
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

export interface DesasignarDocenteRequest {
  id_clase: number;
  id_usuario: number;
}

export interface DesasignarDocenteResponse {
  exito: boolean;
  mensaje: string;
}

export interface DesasignarAuxiliarRequest {
  id_clase: number;
  id_usuario: number;
}

export interface DesasignarAuxiliarResponse {
  exito: boolean;
  mensaje: string;
}

export interface DesasignarMaterialApoyoRequest {
  id_material: number;
}

export interface DesasignarMaterialApoyoResponse {
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

// HeinzGomez - Tipos de segmentación por capítulos (video chapters)
export interface Capitulo {
  id_capitulo: number;
  id_clase: number;
  titulo: string;
  tiempo_inicio: number;
}

export interface CrearCapituloRequest {
  id_clase: number;
  titulo: string;
  tiempo_inicio: number;
}

export interface CrearCapituloResponse {
  exito: boolean;
  mensaje: string;
  capitulo?: Capitulo;
}

export interface EditarCapituloRequest {
  id_capitulo: number;
  titulo: string;
  tiempo_inicio: number;
}

export interface EditarCapituloResponse {
  exito: boolean;
  mensaje: string;
  capitulo?: Capitulo;
}

export interface EliminarCapituloRequest {
  id_capitulo: number;
}

export interface EliminarCapituloResponse {
  exito: boolean;
  mensaje: string;
}

export interface ConsultarCapitulosClaseRequest {
  id_clase: number;
}

export interface ConsultarCapitulosClaseResponse {
  exito: boolean;
  mensaje: string;
  capitulos: Capitulo[];
}
