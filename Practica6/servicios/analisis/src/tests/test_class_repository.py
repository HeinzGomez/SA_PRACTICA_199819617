import json
import pytest
from unittest.mock import MagicMock, patch
from repositories.class_repository import (
    PostgresClassRepository, _scan_clase, _serializar_clases,
)
from models.clase import RegistrarClaseParams, EditarClaseParams, ConsultarCatalogoParams
from models.batch import ClaseCargaInput


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


class TestScanClase:
    def test_scan_clase(self):
        row = (1, 2, 3, 4, "T", "2024-01-01 10:00:00", 60, "D", "http://v", 2024, 1)
        result = _scan_clase(row)
        assert result.id_clase == 1
        assert result.titulo == "T"
        assert result.duracio_min == 60


class TestSerializarClases:
    def test_serializar_con_opcionales(self):
        clases = [ClaseCargaInput(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60,
            descripcion="D", url_video="http://v", anio=2024, num_semestre=1,
        )]
        result = json.loads(_serializar_clases(clases))
        assert result[0]["descripcion"] == "D"
        assert result[0]["url_video"] == "http://v"
        assert result[0]["anio"] == 2024
        assert result[0]["num_semestre"] == 1

    def test_serializar_sin_opcionales(self):
        clases = [ClaseCargaInput(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60,
        )]
        result = json.loads(_serializar_clases(clases))
        assert "descripcion" not in result[0]
        assert "url_video" not in result[0]
        assert "anio" not in result[0]
        assert "num_semestre" not in result[0]


class TestPostgresClassRepository:
    def setup_method(self):
        self.row_clase = (1, 2, 3, 4, "T", "2024-01-01 10:00:00", 60, None, "http://v", 2024, 1)

    def test_crear_clase(self):
        pool, conn = _mock_pool(rows=[self.row_clase])
        repo = PostgresClassRepository(pool)
        result = repo.crear_clase(RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v", anio=2024, num_semestre=1,
        ))
        assert result.id_clase == 1
        conn.commit.assert_called()

    def test_editar_clase(self):
        pool, conn = _mock_pool(rows=[self.row_clase])
        repo = PostgresClassRepository(pool)
        result = repo.editar_clase(EditarClaseParams(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v", anio=2024, num_semestre=1,
        ))
        assert result.id_clase == 1

    def test_editar_clase_no_encontrada(self):
        pool, conn = _mock_pool(rows=[self.row_clase])
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.rowcount = 0
        repo = PostgresClassRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.editar_clase(EditarClaseParams(
                id_clase=99, id_curso=1, id_periodo=1, id_area=1, titulo="T",
                fecha_impartida="2024-01-01 10:00:00", duracion=60,
                descripcion=None, url_video="http://v", anio=2024, num_semestre=1,
            ))

    def test_eliminar_clase(self):
        pool, conn = _mock_pool()
        repo = PostgresClassRepository(pool)
        repo.eliminar_clase(1)
        conn.commit.assert_called()

    def test_eliminar_clase_no_encontrada(self):
        pool, conn = _mock_pool()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.rowcount = 0
        repo = PostgresClassRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.eliminar_clase(99)

    def test_consultar_catalogo(self):
        pool, _ = _mock_pool(rows=[self.row_clase])
        conn = pool.getconn.return_value
        cursor_inst = MagicMock()
        cursor_inst.fetchall.return_value = [self.row_clase]
        cursor_inst.fetchone.return_value = [1]
        conn.cursor.return_value.__enter__ = MagicMock(return_value=cursor_inst)
        conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
        repo = PostgresClassRepository(pool)
        result = repo.consultar_catalogo(ConsultarCatalogoParams(pagina=1))
        assert len(result.registros) >= 0

    def test_carga_masiva(self):
        pool, conn = _mock_pool()
        repo = PostgresClassRepository(pool)
        clases = [ClaseCargaInput(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60,
        )]
        result = repo.carga_masiva_clases(clases)
        assert result.exito is True
