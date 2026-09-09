import pytest
from unittest.mock import MagicMock
from repositories.notification_repository import (
    PostgresNotificationRepository, _scan_notificacion,
)
from models.notification import (
    RegistrarNotificacionParams, ConsultarNotificacionesParams,
)


def _mock_pool(rows=None, rowcount=1):
    pool = MagicMock()
    conn = MagicMock()
    cursor = MagicMock()
    cursor.fetchall.return_value = rows or []
    cursor.fetchone.return_value = rows[0] if rows else None
    cursor.rowcount = rowcount
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    pool.getconn.return_value = conn
    return pool, conn


class TestScanNotificacion:
    def test_scan(self):
        row = (1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01 10:00:00", "ENVIADO")
        n = _scan_notificacion(row)
        assert n.id_notificacion == 1
        assert n.id_usuario == 10
        assert n.tipo == "REGISTRO"
        assert n.asunto == "Bienvenido"
        assert n.mensaje == "msg"
        assert n.fecha_envio == "2024-01-01 10:00:00"
        assert n.estado == "ENVIADO"


class TestPostgresNotificationRepository:
    def test_registrar_notificacion(self):
        notif_row = (1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01 10:00:00", "ENVIADO")
        pool, conn = _mock_pool(rows=[notif_row])
        repo = PostgresNotificationRepository(pool)
        result = repo.registrar_notificacion(
            RegistrarNotificacionParams(id_usuario=10, tipo="REGISTRO", asunto="Bienvenido", mensaje="msg")
        )
        assert result.id_notificacion == 1
        assert result.id_usuario == 10

    def test_registrar_notificacion_no_encontrada(self):
        pool, conn = _mock_pool()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        repo = PostgresNotificationRepository(pool)
        with pytest.raises(ValueError, match="No se encontró la notificación"):
            repo.registrar_notificacion(
                RegistrarNotificacionParams(id_usuario=10, tipo="REGISTRO", asunto="A", mensaje="M")
            )

    def test_consultar_notificaciones(self):
        notif_row = (1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01 10:00:00", "ENVIADO")
        pool, conn = _mock_pool(rows=[notif_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [notif_row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresNotificationRepository(pool)
        result = repo.consultar_notificaciones(ConsultarNotificacionesParams(id_usuario=10, pagina=1))
        assert len(result.registros) == 1
        assert result.total_paginas == 1

    def test_consultar_notificaciones_todos_los_usuarios(self):
        notif_row = (1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01 10:00:00", "ENVIADO")
        pool, conn = _mock_pool(rows=[notif_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [notif_row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresNotificationRepository(pool)
        result = repo.consultar_notificaciones(ConsultarNotificacionesParams(id_usuario=0, pagina=1))
        assert len(result.registros) == 1

    def test_consultar_notificaciones_paginacion(self):
        notif_row = (1, 10, "REGISTRO", "Bienvenido", "msg", "2024-01-01 10:00:00", "ENVIADO")
        pool, conn = _mock_pool(rows=[notif_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [notif_row]
        cursor_inst.fetchone.return_value = [3]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresNotificationRepository(pool)
        result = repo.consultar_notificaciones(ConsultarNotificacionesParams(id_usuario=10, pagina=2))
        assert result.total_paginas == 3
