import pytest
from unittest.mock import MagicMock, patch
from services.notification_service import (
    NotificationService, TIPO_REGISTRO, TIPO_CONTENIDO_NUEVO, TIPO_AVISO_GENERAL,
)
from models.notification import Notificacion, ConsultarNotificacionesResult


@patch("services.notification_service.send_email")
class TestNotificationService:
    def setup_method(self):
        self.repo = MagicMock()
        self.email_service = MagicMock()
        self.svc = NotificationService(self.repo, self.email_service)

    def test_enviar_registro_ok(self, mock_send_email):
        self.email_service.plantilla_registro.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_REGISTRO, "Bienvenido", "msg", "2024-01-01", "ENVIADO"
        )
        result = self.svc.enviar_registro(10, "user@test.com", "Juan")
        assert result.id_notificacion == 1
        self.repo.registrar_notificacion.assert_called_once()

    def test_enviar_registro_pasa_parametros_correctos(self, mock_send_email):
        self.email_service.plantilla_registro.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_REGISTRO, "Bienvenido", "msg", "2024-01-01", "ENVIADO"
        )
        self.svc.enviar_registro(10, "user@test.com", "Juan")
        call_args = self.repo.registrar_notificacion.call_args[0][0]
        assert call_args.id_usuario == 10
        assert call_args.tipo == TIPO_REGISTRO

    def test_enviar_registro_email_error(self, mock_send_email):
        self.email_service.plantilla_registro.side_effect = Exception("email fail")
        with pytest.raises(Exception, match="email fail"):
            self.svc.enviar_registro(10, "user@test.com", "Juan")

    def test_enviar_contenido_nuevo_ok(self, mock_send_email):
        self.email_service.plantilla_contenido_nuevo.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_CONTENIDO_NUEVO, "Nuevo contenido", "msg", "2024-01-01", "ENVIADO"
        )
        result = self.svc.enviar_contenido_nuevo(
            10, ["a@test.com", "b@test.com"], "Titulo", "Descripcion"
        )
        assert len(result.registros) == 2
        assert result.total_paginas == 1
        assert self.repo.registrar_notificacion.call_count == 2

    def test_enviar_contenido_nuevo_un_correo(self, mock_send_email):
        self.email_service.plantilla_contenido_nuevo.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_CONTENIDO_NUEVO, "Nuevo contenido", "msg", "2024-01-01", "ENVIADO"
        )
        result = self.svc.enviar_contenido_nuevo(
            10, ["a@test.com"], "Titulo", ""
        )
        assert len(result.registros) == 1

    def test_enviar_contenido_nuevo_descripcion_vacia(self, mock_send_email):
        self.email_service.plantilla_contenido_nuevo.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_CONTENIDO_NUEVO, "Nuevo contenido", "msg", "2024-01-01", "ENVIADO"
        )
        result = self.svc.enviar_contenido_nuevo(
            10, ["a@test.com"], "Titulo", ""
        )
        assert result is not None

    def test_enviar_aviso_general_ok(self, mock_send_email):
        self.email_service.plantilla_aviso_general.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_AVISO_GENERAL, "Aviso", "msg", "2024-01-01", "ENVIADO"
        )
        result = self.svc.enviar_aviso_general(10, "user@test.com", "Aviso", "mensaje")
        assert result.id_notificacion == 1
        call_args = self.repo.registrar_notificacion.call_args[0][0]
        assert call_args.tipo == TIPO_AVISO_GENERAL

    def test_enviar_aviso_general_pasa_parametros(self, mock_send_email):
        self.email_service.plantilla_aviso_general.return_value = "<html>body</html>"
        self.repo.registrar_notificacion.return_value = Notificacion(
            1, 10, TIPO_AVISO_GENERAL, "Aviso", "msg", "2024-01-01", "ENVIADO"
        )
        self.svc.enviar_aviso_general(10, "user@test.com", "Aviso", "mensaje")
        call_args = self.repo.registrar_notificacion.call_args[0][0]
        assert call_args.id_usuario == 10
        assert call_args.asunto == "Aviso"
        assert call_args.mensaje == "mensaje"

    def test_consultar_notificaciones_ok(self, mock_send_email):
        self.repo.consultar_notificaciones.return_value = ConsultarNotificacionesResult(
            registros=[], total_paginas=5
        )
        result = self.svc.consultar_notificaciones(10, 1)
        assert result.total_paginas == 5
        self.repo.consultar_notificaciones.assert_called_once()
