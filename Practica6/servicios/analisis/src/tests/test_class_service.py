import pytest
from unittest.mock import MagicMock, patch
import json


class TestClassService:
    def setup_method(self):
        from services.class_service import ClassService
        self.repo = MagicMock()
        self.svc = ClassService(self.repo)

    def test_crear_clase_ok(self):
        from models.clase import RegistrarClaseParams
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        self.repo.crear_clase.return_value = MagicMock()
        result = self.svc.crear_clase(params)
        assert result is not None

    def test_crear_clase_titulo_vacio(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="título"):
            self.svc.crear_clase(params)

    def test_crear_clase_titulo_largo(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="X" * 151,
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="150"):
            self.svc.crear_clase(params)

    def test_crear_clase_duracion_cero(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=0,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="duración"):
            self.svc.crear_clase(params)

    def test_crear_clase_url_vacia(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="", anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="URL"):
            self.svc.crear_clase(params)

    def test_crear_clase_url_larga(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://" + "x" * 250, anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="255"):
            self.svc.crear_clase(params)

    def test_crear_clase_anio_invalido(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=1999, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="año"):
            self.svc.crear_clase(params)

    def test_crear_clase_semestre_invalido(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=3,
        )
        with pytest.raises(BusinessValidationError, match="semestre"):
            self.svc.crear_clase(params)

    def test_crear_clase_fecha_invalida(self):
        from models.clase import RegistrarClaseParams
        from models.errors import BusinessValidationError
        params = RegistrarClaseParams(
            id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="invalid-date", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        with pytest.raises(BusinessValidationError, match="fecha"):
            self.svc.crear_clase(params)

    def test_editar_clase_ok(self):
        from models.clase import EditarClaseParams
        params = EditarClaseParams(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="Test",
            fecha_impartida="2024-01-01 10:00:00", duracion=60,
            descripcion=None, url_video="http://v.com", anio=2024, num_semestre=1,
        )
        self.repo.editar_clase.return_value = MagicMock()
        result = self.svc.editar_clase(params)
        assert result is not None

    def test_eliminar_clase_ok(self):
        self.repo.eliminar_clase.return_value = None
        self.svc.eliminar_clase(1)

    def test_eliminar_clase_id_invalido(self):
        from models.errors import BusinessValidationError
        with pytest.raises(BusinessValidationError, match="positivo"):
            self.svc.eliminar_clase(0)

    def test_consultar_catalogo_ok(self):
        from models.clase import ConsultarCatalogoParams
        self.repo.consultar_catalogo.return_value = MagicMock()
        result = self.svc.consultar_catalogo(ConsultarCatalogoParams(pagina=1))
        assert result is not None

    def test_consultar_catalogo_pagina_invalida(self):
        from models.clase import ConsultarCatalogoParams
        from models.errors import BusinessValidationError
        with pytest.raises(BusinessValidationError, match="página"):
            self.svc.consultar_catalogo(ConsultarCatalogoParams(pagina=0))

    def test_carga_masiva_ok(self):
        from models.batch import ClaseCargaInput
        clases = [ClaseCargaInput(id_curso=1, id_periodo=1, id_area=1, titulo="T",
                                   fecha_impartida="2024-01-01 10:00:00", duracion_min=60)]
        self.repo.carga_masiva_clases.return_value = MagicMock()
        result = self.svc.carga_masiva_clases(clases)
        assert result is not None

    def test_carga_masiva_vacia(self):
        from models.errors import BusinessValidationError
        with pytest.raises(BusinessValidationError, match="vacía"):
            self.svc.carga_masiva_clases([])

    def test_carga_masiva_demasiadas(self):
        from models.batch import ClaseCargaInput
        from models.errors import BusinessValidationError
        clases = [ClaseCargaInput(id_curso=1, id_periodo=1, id_area=1, titulo="T",
                                   fecha_impartida="2024-01-01 10:00:00", duracion_min=60)
                  for _ in range(1001)]
        with pytest.raises(BusinessValidationError, match="Demasiadas"):
            self.svc.carga_masiva_clases(clases)
