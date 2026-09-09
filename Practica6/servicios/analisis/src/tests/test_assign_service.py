import pytest
from unittest.mock import MagicMock
from services.assign_service import AssignService
from models.assign import AsignarTemaClaseParams, DesasignarTemaClaseParams
from models.errors import BusinessValidationError


class TestAssignService:
    def setup_method(self):
        self.repo = MagicMock()
        self.svc = AssignService(self.repo)

    def test_asignar_tema_ok(self):
        self.repo.asignar_tema_clase.return_value = MagicMock()
        result = self.svc.asignar_tema_clase(AsignarTemaClaseParams(id_clase=1, id_tema=1))
        assert result is not None

    def test_asignar_tema_clase_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.asignar_tema_clase(AsignarTemaClaseParams(id_clase=0, id_tema=1))

    def test_asignar_tema_tema_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.asignar_tema_clase(AsignarTemaClaseParams(id_clase=1, id_tema=0))

    def test_consultar_temas_clase_ok(self):
        self.repo.consultar_temas_clase.return_value = MagicMock()
        result = self.svc.consultar_temas_clase(1)
        assert result is not None

    def test_consultar_temas_clase_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.consultar_temas_clase(0)

    def test_desasignar_tema_ok(self):
        self.repo.desasignar_tema_clase.return_value = None
        self.svc.desasignar_tema_clase(DesasignarTemaClaseParams(id_clase=1, id_tema=1))

    def test_desasignar_tema_clase_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.desasignar_tema_clase(DesasignarTemaClaseParams(id_clase=0, id_tema=1))

    def test_desasignar_tema_tema_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.desasignar_tema_clase(DesasignarTemaClaseParams(id_clase=1, id_tema=0))
