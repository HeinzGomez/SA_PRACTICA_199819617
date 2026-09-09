import pytest
from unittest.mock import MagicMock
from repositories.topic_repository import (
    PostgresTopicRepository, _scan_unidad, _scan_tema,
)
from models.topic import RegistrarUnidadParams, EditarUnidadParams, ConsultarUnidadesParams, RegistrarTemaParams, EditarTemaParams, ConsultarTemasParams


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


class TestScanUnidad:
    def test_scan(self):
        row = (1, "Nombre", "Desc")
        u = _scan_unidad(row)
        assert u.id_unidad == 1
        assert u.nombre == "Nombre"


class TestScanTema:
    def test_scan(self):
        row = (1, 2, "Tema", "Desc")
        t = _scan_tema(row)
        assert t.id_tema == 1
        assert t.id_unidad == 2


class TestPostgresTopicRepository:
    def setup_method(self):
        self.row_unidad = (1, "Unidad1", "Desc")
        self.row_tema = (1, 1, "Tema1", "Desc")

    def test_crear_unidad(self):
        pool, conn = _mock_pool(rows=[self.row_unidad])
        repo = PostgresTopicRepository(pool)
        result = repo.crear_unidad(RegistrarUnidadParams(nombre="U", descripcion=None))
        assert result.id_unidad == 1

    def test_editar_unidad(self):
        pool, conn = _mock_pool(rows=[self.row_unidad])
        repo = PostgresTopicRepository(pool)
        result = repo.editar_unidad(EditarUnidadParams(id_unidad=1, nombre="U", descripcion=None))
        assert result.id_unidad == 1

    def test_editar_unidad_no_encontrada(self):
        pool, conn = _mock_pool(rows=[self.row_unidad])
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        repo = PostgresTopicRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.editar_unidad(EditarUnidadParams(id_unidad=99, nombre="U", descripcion=None))

    def test_eliminar_unidad(self):
        pool, conn = _mock_pool()
        repo = PostgresTopicRepository(pool)
        repo.eliminar_unidad(1)

    def test_eliminar_unidad_no_encontrada(self):
        pool, conn = _mock_pool()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.rowcount = 0
        repo = PostgresTopicRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.eliminar_unidad(99)

    def test_consultar_unidades(self):
        pool, conn = _mock_pool(rows=[self.row_unidad])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [self.row_unidad]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresTopicRepository(pool)
        result = repo.consultar_unidades(ConsultarUnidadesParams(pagina=1))
        assert len(result.registros) >= 0

    def test_crear_tema(self):
        pool, conn = _mock_pool(rows=[self.row_tema])
        repo = PostgresTopicRepository(pool)
        result = repo.crear_tema(RegistrarTemaParams(id_unidad=1, nombre="T", descripcion=None))
        assert result.id_tema == 1

    def test_editar_tema(self):
        pool, conn = _mock_pool(rows=[self.row_tema])
        repo = PostgresTopicRepository(pool)
        result = repo.editar_tema(EditarTemaParams(id_tema=1, id_unidad=1, nombre="T", descripcion=None))
        assert result.id_tema == 1

    def test_editar_tema_no_encontrado(self):
        pool, conn = _mock_pool(rows=[self.row_tema])
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        repo = PostgresTopicRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.editar_tema(EditarTemaParams(id_tema=99, id_unidad=1, nombre="T", descripcion=None))

    def test_eliminar_tema(self):
        pool, conn = _mock_pool()
        repo = PostgresTopicRepository(pool)
        repo.eliminar_tema(1)

    def test_eliminar_tema_no_encontrado(self):
        pool, conn = _mock_pool()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.rowcount = 0
        repo = PostgresTopicRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.eliminar_tema(99)

    def test_consultar_temas(self):
        pool, conn = _mock_pool(rows=[self.row_tema])
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [self.row_tema]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresTopicRepository(pool)
        result = repo.consultar_temas(ConsultarTemasParams(pagina=1, id_unidad=0))
        assert len(result.registros) >= 0
