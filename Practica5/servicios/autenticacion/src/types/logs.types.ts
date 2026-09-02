export interface AuditLogRow {
  id_auditoria: number;
  usuario_responsable: number;
  operacion: string;
  tabla_afectada: string;
  fecha_evento: Date;
  estado_anterior: string | null;
  estado_nuevo: string | null;
}

export interface ConsultarParams {
  pagina: number;
  usuarioFiltro: number;
  tablaFiltro: string;
}

export interface ConsultarResult {
  registros: AuditLogRow[];
  totalPaginas: number;
}
