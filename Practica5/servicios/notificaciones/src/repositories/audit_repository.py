from abc import ABC, abstractmethod
from typing import List, Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.audit_log import (
    AuditLog,
    ConsultarAuditLogsParams,
    ConsultarAuditLogsResult,
)

PAGE_SIZE = 10

AUDIT_COLUMNS = """
    id_auditoria,
    usuario_responsable,
    operacion,
    tabla_afectada,
    to_char(fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_evento,
    COALESCE(estado_anterior::text, '') AS estado_anterior,
    COALESCE(estado_nuevo::text, '') AS estado_nuevo
"""


def _scan_audit_log(row: tuple) -> AuditLog:
    return AuditLog(
        id_auditoria=row[0],
        usuario_responsable=row[1],
        operacion=row[2],
        tabla_afectada=row[3],
        fecha_evento=row[4],
        estado_anterior=row[5],
        estado_nuevo=row[6],
    )


class AuditLogRepository(ABC):
    @abstractmethod
    def consultar_audit_logs(
        self, params: ConsultarAuditLogsParams
    ) -> ConsultarAuditLogsResult:
        """Consulta el historial de auditoría de notificaciones."""


class PostgresAuditLogRepository(AuditLogRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def consultar_audit_logs(
        self, params: ConsultarAuditLogsParams
    ) -> ConsultarAuditLogsResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT {AUDIT_COLUMNS}
                         FROM audit_notification
                         WHERE (%s = 0 OR usuario_responsable = %s)
                           AND (%s = '' OR tabla_afectada = %s)
                         ORDER BY id_auditoria DESC
                         LIMIT %s OFFSET %s""",
                    (
                        params.usuario_filtro,
                        params.usuario_filtro,
                        params.tabla_filtro,
                        params.tabla_filtro,
                        PAGE_SIZE,
                        offset,
                    ),
                )
                registros: List[AuditLog] = []
                for row in cur.fetchall():
                    registros.append(_scan_audit_log(row))

            with conn.cursor() as cur:
                cur.execute(
                    """SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM audit_notification
                         WHERE (%s = 0 OR usuario_responsable = %s)
                           AND (%s = '' OR tabla_afectada = %s)""",
                    (
                        PAGE_SIZE,
                        params.usuario_filtro,
                        params.usuario_filtro,
                        params.tabla_filtro,
                        params.tabla_filtro,
                    ),
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarAuditLogsResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)
