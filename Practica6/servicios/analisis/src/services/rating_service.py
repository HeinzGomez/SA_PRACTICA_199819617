from datetime import datetime
from typing import List

from models.errors import BusinessValidationError
from models.rating import (
    CalificacionClase,
    CalificacionUsuario,
    ClaseMasVista,
    ClaseValorada,
    ConsultarClasesMasVistasParams,
    ConsultarRankingValoradasParams,
    ConsultarTemasTendenciaParams,
    RegistrarCalificacionParams,
    RegistrarVisualizacionParams,
    TemaTendencia,
    VisualizacionClase,
)
from repositories.rating_repository import RatingRepository
from repositories.redis_repository import RedisRepository

PUNTUACION_MIN = 1
PUNTUACION_MAX = 5
MAX_LIMITE = 100


class RatingService:
    def __init__(
        self,
        repository: RatingRepository,
        cache_repository: RedisRepository | None = None,
    ):
        self.repository = repository
        self.cache_repository = cache_repository

    def registrar_visualizacion(
        self, params: RegistrarVisualizacionParams
    ) -> VisualizacionClase:
        self._validar_id(params.id_clase, "clase")
        resultado = self.repository.registrar_visualizacion(params)
        # if self.cache_repository is not None:
        #     self.cache_repository.invalidar_clases_mas_vistas()
        #     self.cache_repository.invalidar_temas_tendencia()
        return resultado

    def registrar_calificacion(
        self, params: RegistrarCalificacionParams
    ) -> CalificacionClase:
        self._validar_id(params.id_clase, "clase")
        self._validar_id(params.id_usuario, "usuario")
        if params.puntuacion < PUNTUACION_MIN or params.puntuacion > PUNTUACION_MAX:
            raise BusinessValidationError(
                f"La puntuación debe estar entre {PUNTUACION_MIN} y {PUNTUACION_MAX}"
            )
        resultado = self.repository.registrar_calificacion(params)
        # if self.cache_repository is not None:
        #     self.cache_repository.invalidar_ranking_valoradas()
        return resultado

    def consultar_calificacion_usuario(
        self, id_clase: int, id_usuario: int
    ) -> CalificacionUsuario:
        self._validar_id(id_clase, "clase")
        self._validar_id(id_usuario, "usuario")
        return self.repository.consultar_calificacion_usuario(id_clase, id_usuario)

    def consultar_clases_mas_vistas(
        self, params: ConsultarClasesMasVistasParams
    ) -> List[ClaseMasVista]:
        self._validar_rango_fechas(params.fecha_inicio, params.fecha_fin)
        self._validar_limite(params.limite)

        if self.cache_repository is not None:
            cacheado = self.cache_repository.obtener_clases_mas_vistas(
                params.fecha_inicio, params.fecha_fin, params.limite
            )
            if cacheado is not None:
                return cacheado

        registros = self.repository.consultar_clases_mas_vistas(params)

        if self.cache_repository is not None:
            self.cache_repository.guardar_clases_mas_vistas(
                params.fecha_inicio, params.fecha_fin, params.limite, registros
            )
        return registros

    def consultar_temas_tendencia(
        self, params: ConsultarTemasTendenciaParams
    ) -> List[TemaTendencia]:
        self._validar_rango_fechas(params.fecha_inicio, params.fecha_fin)
        self._validar_limite(params.limite)

        if self.cache_repository is not None:
            cacheado = self.cache_repository.obtener_temas_tendencia(
                params.fecha_inicio, params.fecha_fin, params.limite
            )
            if cacheado is not None:
                return cacheado

        registros = self.repository.consultar_temas_tendencia(params)

        if self.cache_repository is not None:
            self.cache_repository.guardar_temas_tendencia(
                params.fecha_inicio, params.fecha_fin, params.limite, registros
            )
        return registros

    def consultar_ranking_valoradas(
        self, params: ConsultarRankingValoradasParams
    ) -> List[ClaseValorada]:
        self._validar_limite(params.limite)

        if self.cache_repository is not None:
            cacheado = self.cache_repository.obtener_ranking_valoradas(
                params.limite
            )
            if cacheado is not None:
                return cacheado

        registros = self.repository.consultar_ranking_valoradas(params)

        if self.cache_repository is not None:
            self.cache_repository.guardar_ranking_valoradas(
                params.limite, registros
            )
        return registros

    @staticmethod
    def _validar_id(id_valor: int, entidad: str) -> None:
        if id_valor <= 0:
            articulo = "del" if entidad in ("tema", "curso", "periodo") else "de la"
            raise BusinessValidationError(
                f"El id {articulo} {entidad} debe ser un número positivo"
            )

    @staticmethod
    def _validar_limite(limite: int) -> None:
        if limite < 0:
            raise BusinessValidationError("El límite no puede ser negativo")
        if limite > MAX_LIMITE:
            raise BusinessValidationError(
                f"El límite no puede superar {MAX_LIMITE}"
            )

    @staticmethod
    def _validar_rango_fechas(fecha_inicio: str, fecha_fin: str) -> None:
        inicio_vacio = not (fecha_inicio or "").strip()
        fin_vacio = not (fecha_fin or "").strip()
        if inicio_vacio and fin_vacio:
            return
        if inicio_vacio or fin_vacio:
            raise BusinessValidationError(
                "Debe indicar ambas fechas (inicio y fin) o ninguna"
            )
        try:
            inicio = datetime.fromisoformat(fecha_inicio)
            fin = datetime.fromisoformat(fecha_fin)
        except ValueError as exc:
            raise BusinessValidationError(
                f"Las fechas no son válidas: '{fecha_inicio}' a '{fecha_fin}'. "
                "Use el formato ISO 8601 (YYYY-MM-DD)"
            ) from exc
        if inicio > fin:
            raise BusinessValidationError(
                "La fecha de inicio no puede ser posterior a la fecha de fin"
            )
