import pytest
from unittest.mock import MagicMock
from services.topic_service import TopicService
from models.topic import (
    RegistrarUnidadParams, EditarUnidadParams, ConsultarUnidadesParams,
    RegistrarTemaParams, EditarTemaParams, ConsultarTemasParams,
)
from models.errors import BusinessValidationError


class TestTopicService:
    def setup_method(self):
        self.repo = MagicMock()
        self.svc = TopicService(self.repo)

    # --- Unidades ---
    def test_crear_unidad_ok(self):
        self.repo.crear_unidad.return_value = MagicMock()
        result = self.svc.crear_unidad(RegistrarUnidadParams(nombre="U1", descripcion=None))
        assert result is not None

    def test_crear_unidad_nombre_vacio(self):
        with pytest.raises(BusinessValidationError, match="nombre"):
            self.svc.crear_unidad(RegistrarUnidadParams(nombre="", descripcion=None))

    def test_crear_unidad_nombre_largo(self):
        with pytest.raises(BusinessValidationError, match="100"):
            self.svc.crear_unidad(RegistrarUnidadParams(nombre="X" * 101, descripcion=None))

    def test_crear_unidad_descripcion_larga(self):
        with pytest.raises(BusinessValidationError, match="1000"):
            self.svc.crear_unidad(RegistrarUnidadParams(nombre="U1", descripcion="X" * 1001))

    def test_editar_unidad_ok(self):
        self.repo.editar_unidad.return_value = MagicMock()
        result = self.svc.editar_unidad(EditarUnidadParams(id_unidad=1, nombre="U1", descripcion=None))
        assert result is not None

    def test_editar_unidad_id_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.editar_unidad(EditarUnidadParams(id_unidad=0, nombre="U1", descripcion=None))

    def test_eliminar_unidad_ok(self):
        self.repo.eliminar_unidad.return_value = None
        self.svc.eliminar_unidad(1)

    def test_eliminar_unidad_id_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.eliminar_unidad(-1)

    def test_consultar_unidades_ok(self):
        self.repo.consultar_unidades.return_value = MagicMock()
        result = self.svc.consultar_unidades(ConsultarUnidadesParams(pagina=1))
        assert result is not None

    def test_consultar_unidades_pagina_invalida(self):
        with pytest.raises(BusinessValidationError, match="página"):
            self.svc.consultar_unidades(ConsultarUnidadesParams(pagina=0))

    # --- Temas ---
    def test_crear_tema_ok(self):
        self.repo.crear_tema.return_value = MagicMock()
        result = self.svc.crear_tema(RegistrarTemaParams(id_unidad=1, nombre="T1", descripcion=None))
        assert result is not None

    def test_crear_tema_unidad_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.crear_tema(RegistrarTemaParams(id_unidad=0, nombre="T1", descripcion=None))

    def test_editar_tema_ok(self):
        self.repo.editar_tema.return_value = MagicMock()
        result = self.svc.editar_tema(EditarTemaParams(id_tema=1, id_unidad=1, nombre="T1", descripcion=None))
        assert result is not None

    def test_editar_tema_id_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.editar_tema(EditarTemaParams(id_tema=0, id_unidad=1, nombre="T1", descripcion=None))

    def test_eliminar_tema_ok(self):
        self.repo.eliminar_tema.return_value = None
        self.svc.eliminar_tema(1)

    def test_eliminar_tema_id_invalido(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.eliminar_tema(0)

    def test_consultar_temas_ok(self):
        self.repo.consultar_temas.return_value = MagicMock()
        result = self.svc.consultar_temas(ConsultarTemasParams(pagina=1, id_unidad=0))
        assert result is not None

    def test_consultar_temas_con_unidad(self):
        self.repo.consultar_temas.return_value = MagicMock()
        result = self.svc.consultar_temas(ConsultarTemasParams(pagina=1, id_unidad=5))
        assert result is not None

    def test_consultar_temas_pagina_invalida(self):
        with pytest.raises(BusinessValidationError, match="página"):
            self.svc.consultar_temas(ConsultarTemasParams(pagina=0))

    def test_consultar_temas_unidad_invalida(self):
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.consultar_temas(ConsultarTemasParams(pagina=1, id_unidad=-1))
