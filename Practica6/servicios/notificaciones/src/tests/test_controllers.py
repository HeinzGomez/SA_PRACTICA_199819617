import sys
import types
import pytest
from unittest.mock import MagicMock

import server as _server_pkg

pb2 = types.ModuleType("server.notificaciones_pb2")
pb2_grpc = types.ModuleType("server.notificaciones_pb2_grpc")

for name in [
    "EnviarNotificacionRegistroResponse", "EnviarNotificacionContenidoNuevoResponse",
    "EnviarNotificacionAvisoGeneralResponse", "ConsultarNotificacionesResponse",
    "ConsultarAuditLogsResponse", "Notificacion", "AuditLog",
]:
    setattr(pb2, name, type(name, (), {"__init__": lambda self, **kw: self.__dict__.update(kw)}))

pb2_grpc.NotificacionesServiceServicer = type("NotificacionesServiceServicer", (), {})

sys.modules["server.notificaciones_pb2"] = pb2
sys.modules["server.notificaciones_pb2_grpc"] = pb2_grpc

from controller.notificaciones_controller import NotificacionesController, _to_pb_notificacion
from controller.log_controller import LogController, _to_pb_audit_log


def _mock_request(**kwargs):
    return MagicMock(**kwargs)


def _mock_context():
    return MagicMock()


class TestNotificacionesController:
    def setup_method(self):
        self.svc = MagicMock()
        self.ctrl = NotificacionesController(self.svc)

    def test_enviar_registro_ok(self):
        self.svc.enviar_registro.return_value = MagicMock(
            id_notificacion=1, id_usuario=10, tipo="REGISTRO",
            asunto="Bienvenido", mensaje="msg", fecha_envio="2024-01-01", estado="ENVIADO",
        )
        req = _mock_request(id_usuario=10, correo="user@test.com", nombre_usuario="Juan")
        result = self.ctrl.EnviarNotificacionRegistro(req, _mock_context())
        assert result.exito is True

    def test_enviar_registro_error(self):
        self.svc.enviar_registro.side_effect = Exception("fail")
        req = _mock_request(id_usuario=10, correo="user@test.com", nombre_usuario="Juan")
        result = self.ctrl.EnviarNotificacionRegistro(req, _mock_context())
        assert result.exito is False

    def test_enviar_contenido_nuevo_ok(self):
        self.svc.enviar_contenido_nuevo.return_value = MagicMock(
            registros=[MagicMock(id_notificacion=1, id_usuario=10, tipo="CONTENIDO_NUEVO",
                                 asunto="A", mensaje="M", fecha_envio="2024-01-01", estado="ENVIADO")],
            total_paginas=1,
        )
        req = _mock_request(id_usuario=10, correos=["a@test.com"], titulo_contenido="T", descripcion="D")
        result = self.ctrl.EnviarNotificacionContenidoNuevo(req, _mock_context())
        assert result.exito is True
        assert result.destinatarios == 1

    def test_enviar_contenido_nuevo_error(self):
        self.svc.enviar_contenido_nuevo.side_effect = Exception("fail")
        req = _mock_request(id_usuario=10, correos=["a@test.com"], titulo_contenido="T", descripcion="D")
        result = self.ctrl.EnviarNotificacionContenidoNuevo(req, _mock_context())
        assert result.exito is False

    def test_enviar_aviso_general_ok(self):
        self.svc.enviar_aviso_general.return_value = MagicMock(
            id_notificacion=1, id_usuario=10, tipo="AVISO_GENERAL",
            asunto="Aviso", mensaje="msg", fecha_envio="2024-01-01", estado="ENVIADO",
        )
        req = _mock_request(id_usuario=10, correo="user@test.com", asunto="Aviso", mensaje="msg")
        result = self.ctrl.EnviarNotificacionAvisoGeneral(req, _mock_context())
        assert result.exito is True

    def test_enviar_aviso_general_error(self):
        self.svc.enviar_aviso_general.side_effect = Exception("fail")
        req = _mock_request(id_usuario=10, correo="user@test.com", asunto="Aviso", mensaje="msg")
        result = self.ctrl.EnviarNotificacionAvisoGeneral(req, _mock_context())
        assert result.exito is False

    def test_consultar_notificaciones_ok(self):
        self.svc.consultar_notificaciones.return_value = MagicMock(registros=[], total_paginas=1)
        req = _mock_request(id_usuario=10, pagina=1)
        result = self.ctrl.ConsultarNotificaciones(req, _mock_context())
        assert result.exito is True
        assert result.total_paginas == 1

    def test_consultar_notificaciones_error(self):
        self.svc.consultar_notificaciones.side_effect = Exception("fail")
        req = _mock_request(id_usuario=10, pagina=1)
        result = self.ctrl.ConsultarNotificaciones(req, _mock_context())
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
        log = MagicMock(
            id_auditoria=1, usuario_responsable=10, operacion="INSERT",
            tabla_afectada="notificaciones", fecha_evento="2024-01-01",
            estado_anterior="", estado_nuevo="{}",
        )
        result = _to_pb_audit_log(log)
        assert result is not None


class TestToPbNotificacion:
    def test_to_pb_notificacion(self):
        n = MagicMock(
            id_notificacion=1, id_usuario=10, tipo="REGISTRO",
            asunto="Bienvenido", mensaje="msg", fecha_envio="2024-01-01", estado="ENVIADO",
        )
        result = _to_pb_notificacion(n)
        assert result is not None
