import pytest
from unittest.mock import MagicMock
from repositories.rating_repository import PostgresRatingRepository
from models.rating import (
    RegistrarVisualizacionParams, RegistrarCalificacionParams,
    ConsultarClasesMasVistasParams, ConsultarTemasTendenciaParams,
    ConsultarRankingValoradasParams,
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


class TestPostgresRatingRepository:
    def test_registrar_visualizacion(self):
        pool, conn = _mock_pool(rows=[(1, "Titulo", 10)])
        repo = PostgresRatingRepository(pool)
        result = repo.registrar_visualizacion(RegistrarVisualizacionParams(id_clase=1))
        assert result.id_clase == 1
        assert result.total_visualizaciones == 10

    def test_registrar_visualizacion_no_encontrada(self):
        pool, conn = _mock_pool(rows=[None])
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        repo = PostgresRatingRepository(pool)
        with pytest.raises(ValueError, match="No se encontró"):
            repo.registrar_visualizacion(RegistrarVisualizacionParams(id_clase=99))

    def test_registrar_calificacion(self):
        pool, conn = _mock_pool(rows=[(1, 4.5, 5)])
        repo = PostgresRatingRepository(pool)
        result = repo.registrar_calificacion(
            RegistrarCalificacionParams(id_clase=1, id_usuario=1, puntuacion=5)
        )
        assert result.promedio == 4.5

    def test_consultar_calificacion_usuario(self):
        pool, conn = _mock_pool(rows=[(1, 1, 4, 4.0, 10)])
        repo = PostgresRatingRepository(pool)
        result = repo.consultar_calificacion_usuario(1, 1)
        assert result.id_clase == 1
        assert result.puntuacion == 4

    def test_consultar_clases_mas_vistas(self):
        row = (1, "Titulo", 100)
        pool, conn = _mock_pool(rows=[row])
        repo = PostgresRatingRepository(pool)
        result = repo.consultar_clases_mas_vistas(
            ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert len(result) == 1
        assert result[0].total_visualizaciones == 100

    def test_consultar_temas_tendencia(self):
        row = (1, "Tema", "Unidad", 50)
        pool, conn = _mock_pool(rows=[row])
        repo = PostgresRatingRepository(pool)
        result = repo.consultar_temas_tendencia(
            ConsultarTemasTendenciaParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert len(result) == 1
        assert result[0].unidad == "Unidad"

    def test_consultar_ranking_valoradas(self):
        row = (1, "Titulo", 4.5, 10)
        pool, conn = _mock_pool(rows=[row])
        repo = PostgresRatingRepository(pool)
        result = repo.consultar_ranking_valoradas(
            ConsultarRankingValoradasParams(limite=10)
        )
        assert len(result) == 1
        assert result[0].promedio == 4.5


class TestFechaONone:
    def test_empty(self):
        from repositories.rating_repository import _fecha_o_none
        assert _fecha_o_none("") is None
        assert _fecha_o_none("  ") is None
        assert _fecha_o_none(None) is None

    def test_valid(self):
        from repositories.rating_repository import _fecha_o_none
        assert _fecha_o_none("2024-01-01") == "2024-01-01"
