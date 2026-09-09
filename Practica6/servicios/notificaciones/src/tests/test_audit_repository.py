import pytest
from unittest.mock import MagicMock
from repositories.audit_repository import (
    PostgresAuditLogRepository, _scan_audit_log,
)
from models.audit_log import ConsultarAuditLogsParams


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


class TestScanAuditLog:
    def test_scan(self):
        row = (1, 10, "INSERT", "notificaciones", "2024-01-01 10:00:00", "", "{}")
        a = _scan_audit_log(row)
        assert a.id_auditoria == 1
        assert a.usuario_responsable == 10
        assert a.operacion == "INSERT"
        assert a.tabla_afectada == "notificaciones"
        assert a.fecha_evento == "2024-01-01 10:00:00"
        assert a.estado_anterior == ""
        assert a.estado_nuevo == "{}"


class TestPostgresAuditLogRepository:
    def test_consultar_sin_filtros(self):
        audit_row = (1, 10, "INSERT", "notificaciones", "2024-01-01 10:00:00", "", "{}")
        pool, conn = _mock_pool(rows=[audit_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [audit_row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAuditLogRepository(pool)
        result = repo.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1))
        assert len(result.registros) == 1
        assert result.total_paginas == 1

    def test_consultar_con_filtros(self):
        audit_row = (1, 10, "INSERT", "notificaciones", "2024-01-01 10:00:00", "", "{}")
        pool, conn = _mock_pool(rows=[audit_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [audit_row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAuditLogRepository(pool)
        result = repo.consultar_audit_logs(
            ConsultarAuditLogsParams(pagina=1, usuario_filtro=10, tabla_filtro="notificaciones")
        )
        assert len(result.registros) == 1

    def test_consultar_todos_los_usuarios(self):
        audit_row = (1, 10, "INSERT", "notificaciones", "2024-01-01 10:00:00", "", "{}")
        pool, conn = _mock_pool(rows=[audit_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [audit_row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAuditLogRepository(pool)
        result = repo.consultar_audit_logs(
            ConsultarAuditLogsParams(pagina=1, usuario_filtro=0, tabla_filtro="")
        )
        assert len(result.registros) == 1

    def test_consultar_paginacion(self):
        audit_row = (1, 10, "INSERT", "notificaciones", "2024-01-01 10:00:00", "", "{}")
        pool, conn = _mock_pool(rows=[audit_row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [audit_row]
        cursor_inst.fetchone.return_value = [3]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAuditLogRepository(pool)
        result = repo.consultar_audit_logs(ConsultarAuditLogsParams(pagina=2))
        assert result.total_paginas == 3
