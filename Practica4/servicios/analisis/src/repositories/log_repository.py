from abc import ABC, abstractmethod
from typing import Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.log import (
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
    estado_anterior,
    estado_nuevo
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


def _filtros(params: ConsultarAuditLogsParams) -> tuple[str, tuple]:
    condiciones = []
    args = []
    if params.tabla_afectada:
        condiciones.append("tabla_afectada = %s")
        args.append(params.tabla_afectada)
    if params.operacion:
        condiciones.append("operacion = %s")
        args.append(params.operacion)
    if params.usuario_responsable != 0:
        condiciones.append("usuario_responsable = %s")
        args.append(params.usuario_responsable)

    if condiciones:
        return " WHERE " + " AND ".join(condiciones), tuple(args)
    return "", ()


class LogRepository(ABC):
    @abstractmethod
    def consultar_audit_logs(
        self, params: ConsultarAuditLogsParams
    ) -> ConsultarAuditLogsResult:
        """Consulta los audit logs con filtros y paginación."""


class PostgresLogRepository(LogRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def consultar_audit_logs(
        self, params: ConsultarAuditLogsParams
    ) -> ConsultarAuditLogsResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        where, args = _filtros(params)

        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT {AUDIT_COLUMNS}
                         FROM audit_logs
                         {where}
                         ORDER BY id_auditoria DESC
                         LIMIT %s OFFSET %s""",
                    args + (PAGE_SIZE, offset),
                )
                registros = [_scan_audit_log(row) for row in cur.fetchall()]

            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM audit_logs
                         {where}""",
                    (PAGE_SIZE,) + args,
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarAuditLogsResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)
