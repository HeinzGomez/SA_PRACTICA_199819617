from datetime import datetime
from typing import List

from models.batch import BatchClaseResponse, ClaseCargaInput
from models.clase import (
    ClaseGrabada,
    ConsultarCatalogoParams,
    ConsultarCatalogoResult,
    EditarClaseParams,
    RegistrarClaseParams,
)
from models.errors import BusinessValidationError
from repositories.class_repository import ClassRepository

MAX_TITULO = 150
MAX_URL_VIDEO = 255
ANIO_MINIMO = 2000
ANIO_MAXIMO = 2100
MAX_CLASES_LOTE = 1000


class ClassService:
    def __init__(self, repository: ClassRepository):
        self.repository = repository

    def crear_clase(self, params: RegistrarClaseParams) -> ClaseGrabada:
        self._validar_campos(
            titulo=params.titulo,
            duracion=params.duracion,
            fecha_impartida=params.fecha_impartida,
            url_video=params.url_video,
            anio=params.anio,
            num_semestre=params.num_semestre,
        )
        return self.repository.crear_clase(params)

    def editar_clase(self, params: EditarClaseParams) -> ClaseGrabada:
        self._validar_campos(
            titulo=params.titulo,
            duracion=params.duracion,
            fecha_impartida=params.fecha_impartida,
            url_video=params.url_video,
            anio=params.anio,
            num_semestre=params.num_semestre,
        )
        return self.repository.editar_clase(params)

    def eliminar_clase(self, id_clase: int) -> None:
        if id_clase <= 0:
            raise BusinessValidationError(
                "El id de la clase debe ser un número positivo"
            )
        self.repository.eliminar_clase(id_clase)

    def consultar_catalogo(
        self, params: ConsultarCatalogoParams
    ) -> ConsultarCatalogoResult:
        if params.pagina < 1:
            raise BusinessValidationError("La página debe ser mayor o igual a 1")
        return self.repository.consultar_catalogo(params)

    def carga_masiva_clases(
        self, clases: List[ClaseCargaInput]
    ) -> BatchClaseResponse:
        if not clases:
            raise BusinessValidationError("La lista de clases está vacía")
        if len(clases) > MAX_CLASES_LOTE:
            raise BusinessValidationError("Demasiadas clases en la carga masiva")
        return self.repository.carga_masiva_clases(clases)

    def _validar_campos(
        self,
        *,
        titulo: str,
        duracion: int,
        fecha_impartida: str,
        url_video: str,
        anio: int,
        num_semestre: int,
    ) -> None:
        if not titulo or not titulo.strip():
            raise BusinessValidationError("El título de la clase es obligatorio")
        if len(titulo) > MAX_TITULO:
            raise BusinessValidationError(
                f"El título no puede superar {MAX_TITULO} caracteres"
            )

        if duracion <= 0:
            raise BusinessValidationError("La duración debe ser mayor a cero")

        if not url_video or not url_video.strip():
            raise BusinessValidationError("La URL del video es obligatoria")
        if len(url_video) > MAX_URL_VIDEO:
            raise BusinessValidationError(
                f"La URL del video no puede superar {MAX_URL_VIDEO} caracteres"
            )

        if anio < ANIO_MINIMO or anio > ANIO_MAXIMO:
            raise BusinessValidationError(
                f"El año debe estar entre {ANIO_MINIMO} y {ANIO_MAXIMO}"
            )

        if num_semestre not in (1, 2):
            raise BusinessValidationError(
                "El número de semestre debe ser 1 o 2"
            )

        self._validar_fecha(fecha_impartida)

    @staticmethod
    def _validar_fecha(fecha_impartida: str) -> None:
        try:
            datetime.fromisoformat(fecha_impartida)
        except ValueError as exc:
            raise BusinessValidationError(
                f"La fecha de impartición '{fecha_impartida}' no es válida. "
                "Use el formato ISO 8601 (YYYY-MM-DD HH:MM:SS)"
            ) from exc
