from models.audit_log import (
    ConsultarAuditLogsParams,
    ConsultarAuditLogsResult,
)
from repositories.audit_repository import AuditLogRepository

TABLA_NOTIFICACIONES = "notificaciones"


class LogService:
    def __init__(self, audit_repository: AuditLogRepository):
        self.audit_repository = audit_repository

    def consultar_audit_logs(
        self, pagina: int, usuario_filtro: int = 0, tabla_filtro: str = ""
    ) -> ConsultarAuditLogsResult:
        pagina = max(pagina, 1)

        if tabla_filtro and tabla_filtro != TABLA_NOTIFICACIONES:
            return ConsultarAuditLogsResult()

        return self.audit_repository.consultar_audit_logs(
            ConsultarAuditLogsParams(
                pagina=pagina,
                usuario_filtro=max(usuario_filtro, 0),
                tabla_filtro=tabla_filtro,
            )
        )
