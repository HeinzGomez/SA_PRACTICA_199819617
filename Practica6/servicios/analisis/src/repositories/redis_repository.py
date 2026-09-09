import json
from abc import ABC, abstractmethod
from dataclasses import asdict, is_dataclass
from typing import List, Optional

from redis import Redis

from config.redis_client import get_redis
from models.rating import (
    ClaseMasVista,
    ClaseValorada,
    TemaTendencia,
)

TTL_HORA = 60

PREFIJO_CLASES_MAS_VISTAS = "analisis:clases_mas_vistas"
PREFIJO_TEMAS_TENDENCIA = "analisis:temas_tendencia"
PREFIJO_RANKING_VALORADAS = "analisis:ranking_valoradas"


def _serializar_registros(registros: list) -> str:
    datos = [
        asdict(registro) if is_dataclass(registro) else registro
        for registro in registros
    ]
    return json.dumps(datos, ensure_ascii=False)


def _deserializar_registros(payload: str, model) -> List[object]:
    datos = json.loads(payload)
    return [model(**registro) for registro in datos]


class RedisRepository(ABC):
    @abstractmethod
    def obtener_clases_mas_vistas(
        self, fecha_inicio: str, fecha_fin: str, limite: int
    ) -> Optional[List[ClaseMasVista]]:
        """Busca el ranking de clases más vistas en caché."""

    @abstractmethod
    def guardar_clases_mas_vistas(
        self, fecha_inicio: str, fecha_fin: str, limite: int, registros: List[ClaseMasVista]
    ) -> None:
        """Guarda el ranking de clases más vistas en caché con TTL."""

    @abstractmethod
    def obtener_temas_tendencia(
        self, fecha_inicio: str, fecha_fin: str, limite: int
    ) -> Optional[List[TemaTendencia]]:
        """Busca los temas en tendencia en caché."""

    @abstractmethod
    def guardar_temas_tendencia(
        self, fecha_inicio: str, fecha_fin: str, limite: int, registros: List[TemaTendencia]
    ) -> None:
        """Guarda los temas en tendencia en caché con TTL."""

    @abstractmethod
    def obtener_ranking_valoradas(
        self, limite: int
    ) -> Optional[List[ClaseValorada]]:
        """Busca el ranking de clases valoradas en caché."""

    @abstractmethod
    def guardar_ranking_valoradas(
        self, limite: int, registros: List[ClaseValorada]
    ) -> None:
        """Guarda el ranking de clases valoradas en caché con TTL."""

    @abstractmethod
    def invalidar_clases_mas_vistas(self) -> None:
        """Invalida la caché de clases más vistas."""

    @abstractmethod
    def invalidar_temas_tendencia(self) -> None:
        """Invalida la caché de temas en tendencia."""

    @abstractmethod
    def invalidar_ranking_valoradas(self) -> None:
        """Invalida la caché del ranking de clases valoradas."""


class RedisCacheRepository(RedisRepository):
    def __init__(self, client: Optional[Redis] = None):
        self.client = client if client is not None else get_redis()

    def obtener_clases_mas_vistas(
        self, fecha_inicio: str, fecha_fin: str, limite: int
    ) -> Optional[List[ClaseMasVista]]:
        clave = _clave(
            PREFIJO_CLASES_MAS_VISTAS, fecha_inicio, fecha_fin, limite
        )
        return self._obtener(clave, ClaseMasVista)

    def guardar_clases_mas_vistas(
        self, fecha_inicio: str, fecha_fin: str, limite: int, registros: List[ClaseMasVista]
    ) -> None:
        clave = _clave(
            PREFIJO_CLASES_MAS_VISTAS, fecha_inicio, fecha_fin, limite
        )
        self._guardar(clave, registros)

    def obtener_temas_tendencia(
        self, fecha_inicio: str, fecha_fin: str, limite: int
    ) -> Optional[List[TemaTendencia]]:
        clave = _clave(
            PREFIJO_TEMAS_TENDENCIA, fecha_inicio, fecha_fin, limite
        )
        return self._obtener(clave, TemaTendencia)

    def guardar_temas_tendencia(
        self, fecha_inicio: str, fecha_fin: str, limite: int, registros: List[TemaTendencia]
    ) -> None:
        clave = _clave(
            PREFIJO_TEMAS_TENDENCIA, fecha_inicio, fecha_fin, limite
        )
        self._guardar(clave, registros)

    def obtener_ranking_valoradas(
        self, limite: int
    ) -> Optional[List[ClaseValorada]]:
        clave = _clave(PREFIJO_RANKING_VALORADAS, limite)
        return self._obtener(clave, ClaseValorada)

    def guardar_ranking_valoradas(
        self, limite: int, registros: List[ClaseValorada]
    ) -> None:
        clave = _clave(PREFIJO_RANKING_VALORADAS, limite)
        self._guardar(clave, registros)

    def invalidar_clases_mas_vistas(self) -> None:
        self._invalidar_prefijo(PREFIJO_CLASES_MAS_VISTAS)

    def invalidar_temas_tendencia(self) -> None:
        self._invalidar_prefijo(PREFIJO_TEMAS_TENDENCIA)

    def invalidar_ranking_valoradas(self) -> None:
        self._invalidar_prefijo(PREFIJO_RANKING_VALORADAS)

    def _obtener(self, clave: str, model) -> Optional[List[object]]:
        try:
            payload = self.client.get(clave)
        except Exception:
            return None
        if payload is None:
            return None
        try:
            return _deserializar_registros(payload, model)
        except (ValueError, TypeError):
            return None

    def _guardar(self, clave: str, registros: list) -> None:
        try:
            self.client.setex(clave, TTL_HORA, _serializar_registros(registros))
        except Exception:
            pass

    def _invalidar_prefijo(self, prefijo: str) -> None:
        try:
            for clave in self.client.scan_iter(f"{prefijo}*"):
                self.client.delete(clave)
        except Exception:
            pass


def _clave(*partes) -> str:
    return ":".join(str(parte) for parte in partes)
