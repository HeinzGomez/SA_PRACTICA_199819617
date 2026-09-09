import pytest
from unittest.mock import MagicMock
from services.rating_service import RatingService
from models.rating import (
    RegistrarVisualizacionParams, RegistrarCalificacionParams,
    ConsultarClasesMasVistasParams, ConsultarTemasTendenciaParams,
    ConsultarRankingValoradasParams,
)
from models.errors import BusinessValidationError


class TestRatingService:
    def setup_method(self):
        self.repo = MagicMock()
        self.cache = MagicMock()
        self.svc = RatingService(self.repo, self.cache)

    # --- Visualizacion ---
    def test_registrar_visualizacion_ok(self):
        self.repo.registrar_visualizacion.return_value = MagicMock()
        result = self.svc.registrar_visualizacion(RegistrarVisualizacionParams(id_clase=1))
        assert result is not None

    def test_registrar_visualizacion_id_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.registrar_visualizacion(RegistrarVisualizacionParams(id_clase=0))

    # --- Calificacion ---
    def test_registrar_calificacion_ok(self):
        self.repo.registrar_calificacion.return_value = MagicMock()
        result = self.svc.registrar_calificacion(
            RegistrarCalificacionParams(id_clase=1, id_usuario=1, puntuacion=3)
        )
        assert result is not None

    def test_registrar_calificacion_puntuacion_baja(self):
        with pytest.raises(BusinessValidationError, match="puntuación"):
            self.svc.registrar_calificacion(
                RegistrarCalificacionParams(id_clase=1, id_usuario=1, puntuacion=0)
            )

    def test_registrar_calificacion_puntuacion_alta(self):
        with pytest.raises(BusinessValidationError, match="puntuación"):
            self.svc.registrar_calificacion(
                RegistrarCalificacionParams(id_clase=1, id_usuario=1, puntuacion=6)
            )

    def test_registrar_calificacion_clase_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.registrar_calificacion(
                RegistrarCalificacionParams(id_clase=0, id_usuario=1, puntuacion=3)
            )

    # --- Consultar calificacion usuario ---
    def test_consultar_calificacion_usuario_ok(self):
        self.repo.consultar_calificacion_usuario.return_value = MagicMock()
        result = self.svc.consultar_calificacion_usuario(1, 1)
        assert result is not None

    def test_consultar_calificacion_usuario_clase_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.consultar_calificacion_usuario(0, 1)

    # --- Clases mas vistas ---
    def test_consultar_clases_mas_vistas_ok(self):
        self.repo.consultar_clases_mas_vistas.return_value = []
        result = self.svc.consultar_clases_mas_vistas(
            ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert result is not None

    def test_consultar_clases_mas_vistas_fechas_vacias(self):
        self.repo.consultar_clases_mas_vistas.return_value = []
        result = self.svc.consultar_clases_mas_vistas(
            ConsultarClasesMasVistasParams(fecha_inicio="", fecha_fin="", limite=10)
        )
        assert result is not None

    def test_consultar_clases_mas_vistas_solo_inicio(self):
        with pytest.raises(BusinessValidationError, match="ambas fechas"):
            self.svc.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="", limite=10)
            )

    def test_consultar_clases_mas_vistas_fecha_invalida(self):
        with pytest.raises(BusinessValidationError, match="no son válidas"):
            self.svc.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(fecha_inicio="bad", fecha_fin="bad", limite=10)
            )

    def test_consultar_clases_mas_vistas_inicio_post_fin(self):
        with pytest.raises(BusinessValidationError, match="posterior"):
            self.svc.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(fecha_inicio="2024-12-31", fecha_fin="2024-01-01", limite=10)
            )

    def test_consultar_clases_mas_vistas_limite_negativo(self):
        with pytest.raises(BusinessValidationError, match="negativo"):
            self.svc.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=-1)
            )

    def test_consultar_clases_mas_vistas_limite_excedido(self):
        with pytest.raises(BusinessValidationError, match="superar"):
            self.svc.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=101)
            )

    def test_consultar_clases_mas_vistas_desde_cache(self):
        cached = [MagicMock()]
        self.cache.obtener_clases_mas_vistas.return_value = cached
        result = self.svc.consultar_clases_mas_vistas(
            ConsultarClasesMasVistasParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert result is cached

    # --- Temas tendencia ---
    def test_consultar_temas_tendencia_ok(self):
        self.repo.consultar_temas_tendencia.return_value = []
        result = self.svc.consultar_temas_tendencia(
            ConsultarTemasTendenciaParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert result is not None

    def test_consultar_temas_tendencia_desde_cache(self):
        cached = [MagicMock()]
        self.cache.obtener_temas_tendencia.return_value = cached
        result = self.svc.consultar_temas_tendencia(
            ConsultarTemasTendenciaParams(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10)
        )
        assert result is cached

    # --- Ranking valoradas ---
    def test_consultar_ranking_valoradas_ok(self):
        self.repo.consultar_ranking_valoradas.return_value = []
        result = self.svc.consultar_ranking_valoradas(
            ConsultarRankingValoradasParams(limite=10)
        )
        assert result is not None

    def test_consultar_ranking_valoradas_desde_cache(self):
        cached = [MagicMock()]
        self.cache.obtener_ranking_valoradas.return_value = cached
        result = self.svc.consultar_ranking_valoradas(
            ConsultarRankingValoradasParams(limite=10)
        )
        assert result is cached

    # --- Sin cache ---
    def test_sin_cache(self):
        svc = RatingService(self.repo, None)
        self.repo.consultar_clases_mas_vistas.return_value = []
        result = svc.consultar_clases_mas_vistas(
            ConsultarClasesMasVistasParams(fecha_inicio="", fecha_fin="", limite=10)
        )
        assert result == []
