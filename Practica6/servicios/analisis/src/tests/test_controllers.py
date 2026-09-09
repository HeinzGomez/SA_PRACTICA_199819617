import sys
import types
import pytest
from unittest.mock import MagicMock

# Ensure the real server package is imported first
import server as _server_pkg  # noqa: F401

# Mock pb2 modules (only the sub-modules, NOT the server package itself)
pb2 = types.ModuleType("server.analisis_pb2")
pb2_grpc = types.ModuleType("server.analisis_pb2_grpc")

for name in [
    "CrearClaseGrabadaResponse", "EditarClaseGrabadaResponse", "EliminarClaseGrabadaResponse",
    "ConsultarCatalogoClasesResponse", "BatchCrearClaseResponse", "BatchCrearClaseResult",
    "ClaseGrabada", "CatalogoClase",
    "CrearUnidadResponse", "EditarUnidadResponse", "EliminarUnidadResponse",
    "ConsultarUnidadesResponse", "CrearTemaResponse", "EditarTemaResponse",
    "EliminarTemaResponse", "ConsultarTemasResponse", "Unidad", "Tema",
    "AsignarTemaClaseGrabadaResponse", "DesasignarTemaClaseGrabadaResponse",
    "VisualizarClaseResponse", "CalificarClaseResponse", "ConsultarCalificacionUsuarioResponse",
    "ConsultarClasesMasVistasResponse", "ConsultarTemasTendenciaResponse",
    "ConsultarRankingValoradasResponse",
    "ClaseVista", "TemaTendencia", "ClaseValorada",
    "ConsultarAuditLogsResponse", "AuditLog",
]:
    setattr(pb2, name, type(name, (), {"__init__": lambda self, **kw: self.__dict__.update(kw)}))

pb2_grpc.AnalisisServiceServicer = type("AnalisisServiceServicer", (), {})

sys.modules["server.analisis_pb2"] = pb2
sys.modules["server.analisis_pb2_grpc"] = pb2_grpc

from controller.class_controller import ClassController
from controller.topic_controller import TopicController
from controller.rating_controller import RatingController
from controller.assign_controller import AssignController
from controller.log_controller import LogController


def _mock_request(**kwargs):
    return MagicMock(**kwargs)


def _mock_context():
    return MagicMock()


class TestClassController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = ClassController(self.svc)

    def test_crear_clase_ok(self):
        self.svc.crear_clase.return_value = MagicMock(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracio_min=60, descripcion=None,
            url_video="http://v", anio=2024, num_semestre=1,
        )
        req = _mock_request(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60, descripcion="",
            url_video="http://v", anio=2024, num_semestre=1,
        )
        result = self.ctrl.CrearClaseGrabada(req, _mock_context())
        assert result.exito is True

    def test_crear_clase_error(self):
        self.svc.crear_clase.side_effect = Exception("fail")
        req = _mock_request(
            id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60, descripcion="",
            url_video="http://v", anio=2024, num_semestre=1,
        )
        result = self.ctrl.CrearClaseGrabada(req, _mock_context())
        assert result.exito is False

    def test_editar_clase_ok(self):
        self.svc.editar_clase.return_value = MagicMock(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracio_min=60, descripcion=None,
            url_video="http://v", anio=2024, num_semestre=1,
        )
        req = _mock_request(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60, descripcion="",
            url_video="http://v", anio=2024, num_semestre=1,
        )
        result = self.ctrl.EditarClaseGrabada(req, _mock_context())
        assert result.exito is True

    def test_editar_clase_error(self):
        self.svc.editar_clase.side_effect = Exception("fail")
        req = _mock_request(
            id_clase=1, id_curso=1, id_periodo=1, id_area=1, titulo="T",
            fecha_impartida="2024-01-01", duracion_min=60, descripcion="",
            url_video="http://v", anio=2024, num_semestre=1,
        )
        result = self.ctrl.EditarClaseGrabada(req, _mock_context())
        assert result.exito is False

    def test_eliminar_clase_ok(self):
        self.svc.eliminar_clase.return_value = None
        req = _mock_request(id_clase=1)
        result = self.ctrl.EliminarClaseGrabada(req, _mock_context())
        assert result.exito is True

    def test_eliminar_clase_error(self):
        self.svc.eliminar_clase.side_effect = Exception("fail")
        req = _mock_request(id_clase=1)
        result = self.ctrl.EliminarClaseGrabada(req, _mock_context())
        assert result.exito is False

    def test_consultar_catalogo_ok(self):
        self.svc.consultar_catalogo.return_value = MagicMock(registros=[])
        req = _mock_request()
        result = self.ctrl.ConsultarCatalogoClases(req, _mock_context())
        assert result.exito is True

    def test_consultar_catalogo_error(self):
        self.svc.consultar_catalogo.side_effect = Exception("fail")
        req = _mock_request()
        result = self.ctrl.ConsultarCatalogoClases(req, _mock_context())
        assert result.exito is False

    def test_carga_masiva_ok(self):
        self.svc.carga_masiva_clases.return_value = MagicMock(exito=True, mensaje="ok", resultados=[])
        item = MagicMock(id_curso=1, id_periodo=1, id_area=1, titulo="T",
                         fecha_impartida="2024-01-01", duracion_min=60,
                         descripcion="", url_video="", anio=2024, num_semestre=1)
        req = _mock_request(clases=[item])
        result = self.ctrl.CargaMasivaClases(req, _mock_context())
        assert result.exito is True

    def test_carga_masiva_error(self):
        self.svc.carga_masiva_clases.side_effect = Exception("fail")
        req = _mock_request(clases=[])
        result = self.ctrl.CargaMasivaClases(req, _mock_context())
        assert result.exito is False


class TestTopicController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = TopicController(self.svc)

    def _test_method(self, method_name, svc_method, svc_return, request_attrs):
        getattr(self.svc, svc_method).return_value = svc_return
        req = _mock_request(**request_attrs)
        result = getattr(self.ctrl, method_name)(req, _mock_context())
        assert result.exito is True

    def _test_method_error(self, method_name, svc_method, request_attrs):
        getattr(self.svc, svc_method).side_effect = Exception("fail")
        req = _mock_request(**request_attrs)
        result = getattr(self.ctrl, method_name)(req, _mock_context())
        assert result.exito is False

    def test_crear_unidad_ok(self):
        self._test_method("CrearUnidad", "crear_unidad", MagicMock(id_unidad=1, nombre="U", descripcion=None), {"nombre": "U", "descripcion": ""})

    def test_crear_unidad_error(self):
        self._test_method_error("CrearUnidad", "crear_unidad", {"nombre": "U", "descripcion": ""})

    def test_editar_unidad_ok(self):
        self._test_method("EditarUnidad", "editar_unidad", MagicMock(id_unidad=1, nombre="U", descripcion=None), {"id_unidad": 1, "nombre": "U", "descripcion": ""})

    def test_editar_unidad_error(self):
        self._test_method_error("EditarUnidad", "editar_unidad", {"id_unidad": 1, "nombre": "U", "descripcion": ""})

    def test_eliminar_unidad_ok(self):
        self.svc.eliminar_unidad.return_value = None
        result = self.ctrl.EliminarUnidad(_mock_request(id_unidad=1), _mock_context())
        assert result.exito is True

    def test_eliminar_unidad_error(self):
        self.svc.eliminar_unidad.side_effect = Exception("fail")
        result = self.ctrl.EliminarUnidad(_mock_request(id_unidad=1), _mock_context())
        assert result.exito is False

    def test_consultar_unidades_ok(self):
        self.svc.consultar_unidades.return_value = MagicMock(registros=[])
        result = self.ctrl.ConsultarUnidades(_mock_request(), _mock_context())
        assert result.exito is True

    def test_consultar_unidades_error(self):
        self.svc.consultar_unidades.side_effect = Exception("fail")
        result = self.ctrl.ConsultarUnidades(_mock_request(), _mock_context())
        assert result.exito is False

    def test_crear_tema_ok(self):
        self._test_method("CrearTema", "crear_tema", MagicMock(id_tema=1, id_unidad=1, nombre="T", descripcion=None), {"id_unidad": 1, "nombre": "T", "descripcion": ""})

    def test_crear_tema_error(self):
        self._test_method_error("CrearTema", "crear_tema", {"id_unidad": 1, "nombre": "T", "descripcion": ""})

    def test_editar_tema_ok(self):
        self._test_method("EditarTema", "editar_tema", MagicMock(id_tema=1, id_unidad=1, nombre="T", descripcion=None), {"id_tema": 1, "id_unidad": 1, "nombre": "T", "descripcion": ""})

    def test_editar_tema_error(self):
        self._test_method_error("EditarTema", "editar_tema", {"id_tema": 1, "id_unidad": 1, "nombre": "T", "descripcion": ""})

    def test_eliminar_tema_ok(self):
        self.svc.eliminar_tema.return_value = None
        result = self.ctrl.EliminarTema(_mock_request(id_tema=1), _mock_context())
        assert result.exito is True

    def test_eliminar_tema_error(self):
        self.svc.eliminar_tema.side_effect = Exception("fail")
        result = self.ctrl.EliminarTema(_mock_request(id_tema=1), _mock_context())
        assert result.exito is False

    def test_consultar_temas_ok(self):
        self.svc.consultar_temas.return_value = MagicMock(registros=[])
        result = self.ctrl.ConsultarTemas(_mock_request(id_unidad=1), _mock_context())
        assert result.exito is True

    def test_consultar_temas_error(self):
        self.svc.consultar_temas.side_effect = Exception("fail")
        result = self.ctrl.ConsultarTemas(_mock_request(id_unidad=1), _mock_context())
        assert result.exito is False


class TestRatingController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = RatingController(self.svc)

    def test_visualizar_ok(self):
        self.svc.registrar_visualizacion.return_value = MagicMock(id_clase=1, titulo="T", total_visualizaciones=10)
        result = self.ctrl.VisualizarClase(_mock_request(id_clase=1), _mock_context())
        assert result.exito is True

    def test_visualizar_error(self):
        self.svc.registrar_visualizacion.side_effect = Exception("fail")
        result = self.ctrl.VisualizarClase(_mock_request(id_clase=1), _mock_context())
        assert result.exito is False

    def test_calificar_ok(self):
        self.svc.registrar_calificacion.return_value = MagicMock(promedio=4.5)
        result = self.ctrl.CalificarClase(_mock_request(id_clase=1, id_usuario=1, puntuacion=5), _mock_context())
        assert result.exito is True

    def test_calificar_error(self):
        self.svc.registrar_calificacion.side_effect = Exception("fail")
        result = self.ctrl.CalificarClase(_mock_request(id_clase=1, id_usuario=1, puntuacion=5), _mock_context())
        assert result.exito is False

    def test_consultar_calificacion_ok(self):
        self.svc.consultar_calificacion_usuario.return_value = MagicMock(puntuacion=4, promedio=4.0, total_calificaciones=10)
        result = self.ctrl.ConsultarCalificacionUsuario(_mock_request(id_clase=1, id_usuario=1), _mock_context())
        assert result.exito is True
        assert result.ya_califico is True

    def test_consultar_calificacion_no_califico(self):
        self.svc.consultar_calificacion_usuario.return_value = MagicMock(puntuacion=0, promedio=4.0, total_calificaciones=10)
        result = self.ctrl.ConsultarCalificacionUsuario(_mock_request(id_clase=1, id_usuario=1), _mock_context())
        assert result.ya_califico is False

    def test_consultar_calificacion_error(self):
        self.svc.consultar_calificacion_usuario.side_effect = Exception("fail")
        result = self.ctrl.ConsultarCalificacionUsuario(_mock_request(id_clase=1, id_usuario=1), _mock_context())
        assert result.exito is False

    def test_clases_mas_vistas_ok(self):
        self.svc.consultar_clases_mas_vistas.return_value = []
        result = self.ctrl.ConsultarClasesMasVistas(_mock_request(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10), _mock_context())
        assert result.exito is True

    def test_clases_mas_vistas_error(self):
        self.svc.consultar_clases_mas_vistas.side_effect = Exception("fail")
        result = self.ctrl.ConsultarClasesMasVistas(_mock_request(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10), _mock_context())
        assert result.exito is False

    def test_temas_tendencia_ok(self):
        self.svc.consultar_temas_tendencia.return_value = []
        result = self.ctrl.ConsultarTemasTendencia(_mock_request(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10), _mock_context())
        assert result.exito is True

    def test_temas_tendencia_error(self):
        self.svc.consultar_temas_tendencia.side_effect = Exception("fail")
        result = self.ctrl.ConsultarTemasTendencia(_mock_request(fecha_inicio="2024-01-01", fecha_fin="2024-12-31", limite=10), _mock_context())
        assert result.exito is False

    def test_ranking_valoradas_ok(self):
        self.svc.consultar_ranking_valoradas.return_value = []
        result = self.ctrl.ConsultarRankingValoradas(_mock_request(limite=10), _mock_context())
        assert result.exito is True

    def test_ranking_valoradas_error(self):
        self.svc.consultar_ranking_valoradas.side_effect = Exception("fail")
        result = self.ctrl.ConsultarRankingValoradas(_mock_request(limite=10), _mock_context())
        assert result.exito is False


class TestAssignController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = AssignController(self.svc)

    def test_asignar_ok(self):
        self.svc.asignar_tema_clase.return_value = MagicMock()
        result = self.ctrl.AsignarTemaClaseGrabada(_mock_request(id_clase=1, id_tema=1), _mock_context())
        assert result.exito is True

    def test_asignar_error(self):
        self.svc.asignar_tema_clase.side_effect = Exception("fail")
        result = self.ctrl.AsignarTemaClaseGrabada(_mock_request(id_clase=1, id_tema=1), _mock_context())
        assert result.exito is False

    def test_desasignar_ok(self):
        self.svc.desasignar_tema_clase.return_value = None
        result = self.ctrl.DesasignarTemaClaseGrabada(_mock_request(id_clase=1, id_tema=1), _mock_context())
        assert result.exito is True

    def test_desasignar_error(self):
        self.svc.desasignar_tema_clase.side_effect = Exception("fail")
        result = self.ctrl.DesasignarTemaClaseGrabada(_mock_request(id_clase=1, id_tema=1), _mock_context())
        assert result.exito is False


class TestLogController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = LogController(self.svc)

    def test_consultar_ok(self):
        self.svc.consultar_audit_logs.return_value = MagicMock(registros=[], total_paginas=1)
        result = self.ctrl.ConsultarAuditLogs(
            _mock_request(pagina=1, tabla_filtro="", usuario_filtro=0), _mock_context()
        )
        assert result.exito is True

    def test_consultar_error(self):
        self.svc.consultar_audit_logs.side_effect = Exception("fail")
        result = self.ctrl.ConsultarAuditLogs(
            _mock_request(pagina=1, tabla_filtro="", usuario_filtro=0), _mock_context()
        )
        assert result.exito is False

    def test_to_pb_audit_log(self):
        from controller.log_controller import _to_pb_audit_log, _serializar_estado
        log = MagicMock(
            id_auditoria=1, usuario_responsable=10, operacion="INSERT",
            tabla_afectada="users", fecha_evento="2024-01-01",
            estado_anterior=None, estado_nuevo={"a": 1},
        )
        result = _to_pb_audit_log(log)
        assert result is not None
        assert _serializar_estado(None) == ""
        assert _serializar_estado({"a": 1}) == '{"a": 1}'
