from models.assign import (
    AsignarTemaClaseParams,
    ConsultarTemasClaseResult,
    DesasignarTemaClaseParams,
)
from models.errors import BusinessValidationError
from repositories.assign_repository import AssignRepository


class AssignService:
    def __init__(self, repository: AssignRepository):
        self.repository = repository

    def asignar_tema_clase(
        self, params: AsignarTemaClaseParams
    ) -> ConsultarTemasClaseResult:
        self._validar_id(params.id_clase, "clase")
        self._validar_id(params.id_tema, "tema")
        return self.repository.asignar_tema_clase(params)

    def consultar_temas_clase(self, id_clase: int) -> ConsultarTemasClaseResult:
        self._validar_id(id_clase, "clase")
        return self.repository.consultar_temas_clase(id_clase)

    def desasignar_tema_clase(
        self, params: DesasignarTemaClaseParams
    ) -> None:
        self._validar_id(params.id_clase, "clase")
        self._validar_id(params.id_tema, "tema")
        self.repository.desasignar_tema_clase(params)

    @staticmethod
    def _validar_id(id_valor: int, entidad: str) -> None:
        if id_valor <= 0:
            articulo = "del" if entidad in ("tema", "curso", "periodo") else "de la"
            raise BusinessValidationError(
                f"El id {articulo} {entidad} debe ser un número positivo"
            )
