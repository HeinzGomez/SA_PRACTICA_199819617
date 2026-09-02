from server import notificaciones_pb2 as pb2
from server import notificaciones_pb2_grpc as pb2_grpc
from services.log_service import LogService


class LogController(pb2_grpc.NotificacionesServiceServicer):
    def __init__(self, log_service: LogService):
        self.log_service = log_service

    def ConsultarAuditLogs(self, request, context):
        try:
            resultado = self.log_service.consultar_audit_logs(
                pagina=request.pagina,
                usuario_filtro=request.usuario_filtro,
                tabla_filtro=request.tabla_filtro,
            )
            return pb2.ConsultarAuditLogsResponse(
                exito=True,
                mensaje="Consulta exitosa",
                registros=[
                    _to_pb_audit_log(a) for a in resultado.registros
                ],
                total_paginas=resultado.total_paginas,
            )
        except Exception as exc:
            return pb2.ConsultarAuditLogsResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_audit_log(audit_log) -> pb2.AuditLog:
    return pb2.AuditLog(
        id_auditoria=audit_log.id_auditoria,
        usuario_responsable=audit_log.usuario_responsable,
        operacion=audit_log.operacion,
        tabla_afectada=audit_log.tabla_afectada,
        fecha_evento=audit_log.fecha_evento,
        estado_anterior=audit_log.estado_anterior,
        estado_nuevo=audit_log.estado_nuevo,
    )
