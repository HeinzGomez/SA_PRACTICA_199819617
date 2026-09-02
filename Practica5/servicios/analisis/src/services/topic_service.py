from models.errors import BusinessValidationError
from models.topic import (
    ConsultarTemasParams,
    ConsultarTemasResult,
    ConsultarUnidadesParams,
    ConsultarUnidadesResult,
    EditarTemaParams,
    EditarUnidadParams,
    RegistrarTemaParams,
    RegistrarUnidadParams,
    Tema,
    Unidad,
)
from repositories.topic_repository import TopicRepository

MAX_NOMBRE_UNIDAD = 100
MAX_NOMBRE_TEMA = 100
MAX_DESCRIPCION = 1000


class TopicService:
    def __init__(self, repository: TopicRepository):
        self.repository = repository

    def crear_unidad(self, params: RegistrarUnidadParams) -> Unidad:
        self._validar_nombre_y_descripcion(params.nombre, params.descripcion)
        return self.repository.crear_unidad(params)

    def editar_unidad(self, params: EditarUnidadParams) -> Unidad:
        self._validar_id(params.id_unidad, "unidad")
        self._validar_nombre_y_descripcion(params.nombre, params.descripcion)
        return self.repository.editar_unidad(params)

    def eliminar_unidad(self, id_unidad: int) -> None:
        self._validar_id(id_unidad, "unidad")
        self.repository.eliminar_unidad(id_unidad)

    def consultar_unidades(
        self, params: ConsultarUnidadesParams
    ) -> ConsultarUnidadesResult:
        self._validar_pagina(params.pagina)
        return self.repository.consultar_unidades(params)

    def crear_tema(self, params: RegistrarTemaParams) -> Tema:
        self._validar_id(params.id_unidad, "unidad")
        self._validar_nombre_y_descripcion(params.nombre, params.descripcion)
        return self.repository.crear_tema(params)

    def editar_tema(self, params: EditarTemaParams) -> Tema:
        self._validar_id(params.id_tema, "tema")
        self._validar_id(params.id_unidad, "unidad")
        self._validar_nombre_y_descripcion(params.nombre, params.descripcion)
        return self.repository.editar_tema(params)

    def eliminar_tema(self, id_tema: int) -> None:
        self._validar_id(id_tema, "tema")
        self.repository.eliminar_tema(id_tema)

    def consultar_temas(
        self, params: ConsultarTemasParams
    ) -> ConsultarTemasResult:
        self._validar_pagina(params.pagina)
        if params.id_unidad != 0:
            self._validar_id(params.id_unidad, "unidad")
        return self.repository.consultar_temas(params)

    @staticmethod
    def _validar_id(id_valor: int, entidad: str) -> None:
        if id_valor <= 0:
            articulo = "del" if entidad in ("tema", "curso", "periodo") else "de la"
            raise BusinessValidationError(
                f"El id {articulo} {entidad} debe ser un número positivo"
            )

    @staticmethod
    def _validar_pagina(pagina: int) -> None:
        if pagina < 1:
            raise BusinessValidationError("La página debe ser mayor o igual a 1")

    @staticmethod
    def _validar_nombre_y_descripcion(nombre: str, descripcion: str | None) -> None:
        if not nombre or not nombre.strip():
            raise BusinessValidationError("El nombre es obligatorio")
        if len(nombre) > MAX_NOMBRE_UNIDAD:
            raise BusinessValidationError(
                f"El nombre no puede superar {MAX_NOMBRE_UNIDAD} caracteres"
            )
        if descripcion and len(descripcion) > MAX_DESCRIPCION:
            raise BusinessValidationError(
                f"La descripción no puede superar {MAX_DESCRIPCION} caracteres"
            )
