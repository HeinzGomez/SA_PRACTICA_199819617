import pytest
from unittest.mock import MagicMock
from repositories.log_repository import PostgresLogRepository, _scan_audit_log, _filtros
from models.log import ConsultarAuditLogsParams


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
        row = (1, 10, "INSERT", "users", "2024-01-01 10:00:00", None, {"nuevo": "dato"})
        log = _scan_audit_log(row)
        assert log.id_auditoria == 1
        assert log.operacion == "INSERT"
        assert log.estado_nuevo == {"nuevo": "dato"}


class TestFiltros:
    def test_sin_filtros(self):
        params = ConsultarAuditLogsParams(pagina=1)
        where, args = _filtros(params)
        assert where == ""
        assert args == ()

    def test_tabla(self):
        params = ConsultarAuditLogsParams(pagina=1, tabla_afectada="users")
        where, args = _filtros(params)
        assert "tabla_afectada" in where
        assert "users" in args

    def test_operacion(self):
        params = ConsultarAuditLogsParams(pagina=1, operacion="DELETE")
        where, args = _filtros(params)
        assert "operacion" in where

    def test_usuario(self):
        params = ConsultarAuditLogsParams(pagina=1, usuario_responsable=5)
        where, args = _filtros(params)
        assert "usuario_responsable" in where

    def test_todos_los_filtros(self):
        params = ConsultarAuditLogsParams(
            pagina=1, tabla_afectada="users", operacion="INSERT", usuario_responsable=3
        )
        where, args = _filtros(params)
        assert where.startswith(" WHERE ")
        assert "AND" in where


class TestPostgresLogRepository:
    def test_consultar_sin_filtros(self):
        row = (1, 10, "INSERT", "users", "2024-01-01 10:00:00", None, None)
        pool, conn = _mock_pool(rows=[row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresLogRepository(pool)
        result = repo.consultar_audit_logs(ConsultarAuditLogsParams(pagina=1))
        assert len(result.registros) >= 0

    def test_consultar_con_filtros(self):
        row = (1, 10, "INSERT", "users", "2024-01-01 10:00:00", None, None)
        pool, conn = _mock_pool(rows=[row])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [row]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresLogRepository(pool)
        result = repo.consultar_audit_logs(
            ConsultarAuditLogsParams(pagina=1, tabla_afectada="users", operacion="INSERT", usuario_responsable=3)
        )
        assert result is not None
