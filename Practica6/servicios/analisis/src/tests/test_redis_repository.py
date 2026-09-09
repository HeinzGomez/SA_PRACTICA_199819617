import json
import pytest
from unittest.mock import MagicMock
from repositories.redis_repository import (
    RedisCacheRepository, _serializar_registros, _deserializar_registros, _clave,
)
from models.rating import ClaseMasVista, TemaTendencia, ClaseValorada


class TestSerializarDeserializar:
    def test_roundtrip_clase_mas_vista(self):
        registros = [ClaseMasVista(id_clase=1, titulo="T", total_visualizaciones=10)]
        payload = _serializar_registros(registros)
        result = _deserializar_registros(payload, ClaseMasVista)
        assert len(result) == 1
        assert result[0].id_clase == 1

    def test_roundtrip_tema_tendencia(self):
        registros = [TemaTendencia(id_tema=1, nombre="T", unidad="U", total_visualizaciones=5)]
        payload = _serializar_registros(registros)
        result = _deserializar_registros(payload, TemaTendencia)
        assert result[0].unidad == "U"

    def test_roundtrip_clase_valorada(self):
        registros = [ClaseValorada(id_clase=1, titulo="T", promedio=4.5, total_calificaciones=10)]
        payload = _serializar_registros(registros)
        result = _deserializar_registros(payload, ClaseValorada)
        assert result[0].promedio == 4.5


class TestClave:
    def test_clave(self):
        assert _clave("a", "b", "c") == "a:b:c"
        assert _clave(1, 2, 3) == "1:2:3"


class TestRedisCacheRepository:
    def setup_method(self):
        self.client = MagicMock()
        self.repo = RedisCacheRepository(self.client)

    def test_obtener_clases_mas_vistas_hit(self):
        data = [{"id_clase": 1, "titulo": "T", "total_visualizaciones": 10}]
        self.client.get.return_value = json.dumps(data)
        result = self.repo.obtener_clases_mas_vistas("2024-01-01", "2024-12-31", 10)
        assert result is not None
        assert len(result) == 1

    def test_obtener_clases_mas_vistas_miss(self):
        self.client.get.return_value = None
        result = self.repo.obtener_clases_mas_vistas("2024-01-01", "2024-12-31", 10)
        assert result is None

    def test_obtener_clases_mas_vistas_error(self):
        self.client.get.side_effect = Exception("redis down")
        result = self.repo.obtener_clases_mas_vistas("2024-01-01", "2024-12-31", 10)
        assert result is None

    def test_guardar_clases_mas_vistas(self):
        registros = [ClaseMasVista(id_clase=1, titulo="T", total_visualizaciones=10)]
        self.repo.guardar_clases_mas_vistas("2024-01-01", "2024-12-31", 10, registros)
        self.client.setex.assert_called_once()

    def test_obtener_temas_tendencia(self):
        data = [{"id_tema": 1, "nombre": "T", "unidad": "U", "total_visualizaciones": 5}]
        self.client.get.return_value = json.dumps(data)
        result = self.repo.obtener_temas_tendencia("2024-01-01", "2024-12-31", 10)
        assert result is not None

    def test_guardar_temas_tendencia(self):
        registros = [TemaTendencia(id_tema=1, nombre="T", unidad="U", total_visualizaciones=5)]
        self.repo.guardar_temas_tendencia("2024-01-01", "2024-12-31", 10, registros)
        self.client.setex.assert_called_once()

    def test_obtener_ranking_valoradas(self):
        data = [{"id_clase": 1, "titulo": "T", "promedio": 4.5, "total_calificaciones": 10}]
        self.client.get.return_value = json.dumps(data)
        result = self.repo.obtener_ranking_valoradas(10)
        assert result is not None

    def test_guardar_ranking_valoradas(self):
        registros = [ClaseValorada(id_clase=1, titulo="T", promedio=4.5, total_calificaciones=10)]
        self.repo.guardar_ranking_valoradas(10, registros)
        self.client.setex.assert_called_once()

    def test_invalidar_clases_mas_vistas(self):
        self.client.scan_iter.return_value = ["key1", "key2"]
        self.repo.invalidar_clases_mas_vistas()
        assert self.client.delete.call_count == 2

    def test_invalidar_temas_tendencia(self):
        self.client.scan_iter.return_value = ["key1"]
        self.repo.invalidar_temas_tendencia()
        self.client.delete.assert_called_once()

    def test_invalidar_ranking_valoradas(self):
        self.client.scan_iter.return_value = []
        self.repo.invalidar_ranking_valoradas()

    def test_invalidar_error(self):
        self.client.scan_iter.side_effect = Exception("error")
        self.repo.invalidar_clases_mas_vistas()

    def test_guardar_error(self):
        self.client.setex.side_effect = Exception("error")
        self.repo.guardar_clases_mas_vistas("2024-01-01", "2024-12-31", 10, [])

    def test_obtener_datos_corruptos(self):
        self.client.get.return_value = "not-json"
        result = self.repo.obtener_clases_mas_vistas("2024-01-01", "2024-12-31", 10)
        assert result is None

    def test_obtener_tema_tendencia_miss(self):
        self.client.get.return_value = None
        result = self.repo.obtener_temas_tendencia("2024-01-01", "2024-12-31", 10)
        assert result is None

    def test_obtener_ranking_miss(self):
        self.client.get.return_value = None
        result = self.repo.obtener_ranking_valoradas(10)
        assert result is None
