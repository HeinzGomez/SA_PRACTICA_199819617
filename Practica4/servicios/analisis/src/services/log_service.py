from models.errors import BusinessValidationError
from models.log import (
    ConsultarAuditLogsParams,
    ConsultarAuditLogsResult,
)
from repositories.log_repository import LogRepository

MAX_TABLA = 50
MAX_OPERACION = 50


class LogService:
    def __init__(self, repository: LogRepository):
        self.repository = repository

    def consultar_audit_logs(
        self, params: ConsultarAuditLogsParams
    ) -> ConsultarAuditLogsResult:
        if params.pagina < 1:
            raise BusinessValidationError("La página debe ser mayor o igual a 1")

        if params.usuario_responsable != 0 and params.usuario_responsable < 0:
            raise BusinessValidationError(
                "El usuario responsable debe ser un número positivo"
            )

        if params.tabla_afectada and len(params.tabla_afectada) > MAX_TABLA:
            raise BusinessValidationError(
                f"La tabla afectada no puede superar {MAX_TABLA} caracteres"
            )

        if params.operacion and len(params.operacion) > MAX_OPERACION:
            raise BusinessValidationError(
                f"La operación no puede superar {MAX_OPERACION} caracteres"
            )

        return self.repository.consultar_audit_logs(params)
