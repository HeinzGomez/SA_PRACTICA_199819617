import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { LogsService } from "../services/log_service";
import { AuditLogRow } from "../types/logs.types";
import {
  AuditLogResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
} from "../types/logs.controller.types";
import { buildError } from "./error_mapper";

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
      callback(buildError(error));
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
}
