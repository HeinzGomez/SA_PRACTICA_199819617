import pytest
from unittest.mock import MagicMock
from repositories.assign_repository import PostgresAssignRepository, _scan_tema_asignado
from models.assign import AsignarTemaClaseParams, DesasignarTemaClaseParams
from models.errors import NotFoundError


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


class TestScanTemaAsignado:
    def test_scan(self):
        row = (1, 2, "Tema", "Desc")
        t = _scan_tema_asignado(row)
        assert t.id_tema == 1
        assert t.id_unidad == 2


class TestPostgresAssignRepository:
    def test_asignar_tema_clase(self):
        row_valida = (1,)
        row_tema = (1, 1, "Tema", "Desc")
        pool, conn = _mock_pool()
        cursor = MagicMock()
        cursor.fetchone.side_effect = [row_valida, row_valida, row_tema]
        cursor.fetchall.return_value = [row_tema]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAssignRepository(pool)
        result = repo.asignar_tema_clase(AsignarTemaClaseParams(id_clase=1, id_tema=1))
        assert len(result.registros) >= 0

    def test_asignar_clase_no_encontrada(self):
        pool, conn = _mock_pool()
        cursor = MagicMock()
        cursor.fetchone.return_value = None
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAssignRepository(pool)
        with pytest.raises(ValueError, match="No se encontró la clase"):
            repo.asignar_tema_clase(AsignarTemaClaseParams(id_clase=99, id_tema=1))

    def test_asignar_tema_no_encontrado(self):
        pool, conn = _mock_pool()
        cursor = MagicMock()
        row_valida = (1,)
        cursor.fetchone.side_effect = [row_valida, None]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAssignRepository(pool)
        with pytest.raises(ValueError, match="No se encontró el tema"):
            repo.asignar_tema_clase(AsignarTemaClaseParams(id_clase=1, id_tema=99))

    def test_consultar_temas_clase(self):
        row_valida = (1,)
        row_tema = (1, 1, "Tema", "Desc")
        pool, conn = _mock_pool()
        cursor = MagicMock()
        cursor.fetchone.side_effect = [row_valida]
        cursor.fetchall.return_value = [row_tema]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresAssignRepository(pool)
        result = repo.consultar_temas_clase(1)
        assert result.id_clase == 1

    def test_desasignar_tema(self):
        pool, conn = _mock_pool(rowcount=1)
        repo = PostgresAssignRepository(pool)
        repo.desasignar_tema_clase(DesasignarTemaClaseParams(id_clase=1, id_tema=1))

    def test_desasignar_tema_no_existe(self):
        pool, conn = _mock_pool(rowcount=0)
        repo = PostgresAssignRepository(pool)
        with pytest.raises(NotFoundError, match="no existe"):
            repo.desasignar_tema_clase(DesasignarTemaClaseParams(id_clase=1, id_tema=99))
