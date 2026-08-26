import { sendUnaryData, ServerUnaryCall, ServiceError, status } from "@grpc/grpc-js";
import { LogsService } from "../services/logs_service";
import { AuditLogRow } from "../types/logs.types";
import {
  AuditLogResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
} from "../types/logs.controller.types";

export class LogsController {
  constructor(private logsService: LogsService) {}

  async consultarAuditLogs(
    call: ServerUnaryCall<ConsultarAuditLogsRequest, ConsultarAuditLogsResponse>,
    callback: sendUnaryData<ConsultarAuditLogsResponse>
  ): Promise<void> {
    try {
      const { pagina, usuario_filtro, tabla_filtro } = call.request;

      const result = await this.logsService.consultar({
        pagina,
        usuarioFiltro: usuario_filtro,
        tablaFiltro: tabla_filtro,
      });

      callback(null, {
        exito: true,
        mensaje: "Auditoría consultada exitosamente",
        registros: result.registros.map((log) => this.mapAuditLog(log)),
        total_paginas: result.totalPaginas,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  private mapAuditLog(log: AuditLogRow): AuditLogResponse {
    return {
      id_auditoria: log.id_auditoria,
      usuario_responsable: log.usuario_responsable,
      operacion: log.operacion,
      tabla_afectada: log.tabla_afectada,
      fecha_evento: log.fecha_evento.toISOString(),
      estado_anterior: this.mapEstado(log.estado_anterior),
      estado_nuevo: this.mapEstado(log.estado_nuevo),
    };
  }

  private mapEstado(estado: unknown): string {
    if (estado === null || estado === undefined) return "";
    if (typeof estado === "string") return estado;
    return JSON.stringify(estado);
  }

  private buildError(code: number, mensaje: string): ServiceError {
    const error = new Error(mensaje) as ServiceError;
    error.code = code;
    error.details = mensaje;
    return error;
  }
}
