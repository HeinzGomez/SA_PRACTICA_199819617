import json

from server import analisis_pb2 as pb2
from server import analisis_pb2_grpc as pb2_grpc

from models.log import ConsultarAuditLogsParams


class LogController(pb2_grpc.AnalisisServiceServicer):
    def __init__(self, log_service):
        self.log_service = log_service

    def ConsultarAuditLogs(self, request, context):
        try:
            resultado = self.log_service.consultar_audit_logs(
                ConsultarAuditLogsParams(
                    pagina=request.pagina,
                    tabla_afectada=request.tabla_filtro,
                    operacion="",
                    usuario_responsable=request.usuario_filtro,
                )
            )
            return pb2.ConsultarAuditLogsResponse(
                exito=True,
                mensaje="Audit logs consultados",
                registros=[
                    _to_pb_audit_log(log) for log in resultado.registros
                ],
                total_paginas=resultado.total_paginas,
            )
        except Exception as exc:
            return pb2.ConsultarAuditLogsResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_audit_log(log) -> pb2.AuditLog:
    return pb2.AuditLog(
        id_auditoria=log.id_auditoria,
        usuario_responsable=log.usuario_responsable,
        operacion=log.operacion,
        tabla_afectada=log.tabla_afectada,
        fecha_evento=log.fecha_evento,
        estado_anterior=_serializar_estado(log.estado_anterior),
        estado_nuevo=_serializar_estado(log.estado_nuevo),
    )


def _serializar_estado(estado) -> str:
    if estado is None:
        return ""
    return json.dumps(estado, ensure_ascii=False)
