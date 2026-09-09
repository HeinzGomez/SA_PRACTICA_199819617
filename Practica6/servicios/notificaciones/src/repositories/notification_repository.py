from abc import ABC, abstractmethod
from typing import List, Optional

from psycopg2.pool import ThreadedConnectionPool

from config.database import get_database
from models.notification import (
    ConsultarNotificacionesParams,
    ConsultarNotificacionesResult,
    Notificacion,
    RegistrarNotificacionParams,
)

PAGE_SIZE = 10

NOTIFICACION_COLUMNS = """
    id_notificacion,
    id_usuario,
    tipo,
    asunto,
    mensaje,
    to_char(fecha_envio, 'YYYY-MM-DD HH24:MI:SS') AS fecha_envio,
    estado
"""


def _scan_notificacion(row: tuple) -> Notificacion:
    return Notificacion(
        id_notificacion=row[0],
        id_usuario=row[1],
        tipo=row[2],
        asunto=row[3],
        mensaje=row[4],
        fecha_envio=row[5],
        estado=row[6],
    )


class NotificationRepository(ABC):
    @abstractmethod
    def registrar_notificacion(
        self, params: RegistrarNotificacionParams
    ) -> Notificacion:
        """Guarda una notificación usando sp_registrar_notificacion."""

    @abstractmethod
    def consultar_notificaciones(
        self, params: ConsultarNotificacionesParams
    ) -> ConsultarNotificacionesResult:
        """Consulta el historial de notificaciones usando vw_notificaciones."""


class PostgresNotificationRepository(NotificationRepository):
    def __init__(self, pool: Optional[ThreadedConnectionPool] = None):
        self.pool = pool if pool is not None else get_database()

    def registrar_notificacion(
        self, params: RegistrarNotificacionParams
    ) -> Notificacion:
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "CALL sp_registrar_notificacion(%s, %s, %s, %s)",
                    (params.id_usuario, params.tipo, params.asunto, params.mensaje),
                )
            conn.commit()

            return self._buscar_reciente(conn, params.id_usuario, params.tipo)
        finally:
            self.pool.putconn(conn)

    def consultar_notificaciones(
        self, params: ConsultarNotificacionesParams
    ) -> ConsultarNotificacionesResult:
        offset = (params.pagina - 1) * PAGE_SIZE
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT {NOTIFICACION_COLUMNS}
                         FROM vw_notificaciones
                         WHERE (%s = 0 OR id_usuario = %s)
                         LIMIT %s OFFSET %s""",
                    (params.id_usuario, params.id_usuario, PAGE_SIZE, offset),
                )
                registros: List[Notificacion] = []
                for row in cur.fetchall():
                    registros.append(_scan_notificacion(row))

            with conn.cursor() as cur:
                cur.execute(
                    """SELECT CEIL(COUNT(*)::numeric / %s)::int
                         FROM vw_notificaciones
                         WHERE (%s = 0 OR id_usuario = %s)""",
                    (PAGE_SIZE, params.id_usuario, params.id_usuario),
                )
                total_paginas = cur.fetchone()[0]

            return ConsultarNotificacionesResult(
                registros=registros,
                total_paginas=total_paginas,
            )
        finally:
            self.pool.putconn(conn)

    def _buscar_reciente(self, conn, id_usuario: int, tipo: str) -> Notificacion:
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT {NOTIFICACION_COLUMNS}
                     FROM vw_notificaciones
                     WHERE id_usuario = %s AND tipo = %s
                     ORDER BY id_notificacion DESC
                     LIMIT 1""",
                (id_usuario, tipo),
            )
            row = cur.fetchone()
            if row is None:
                raise ValueError("No se encontró la notificación registrada")
            return _scan_notificacion(row)
