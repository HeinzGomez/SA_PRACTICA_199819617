import sys
import types
import pytest
from unittest.mock import MagicMock, patch

if "grpc" not in sys.modules:
    sys.modules["grpc"] = MagicMock()

pb2 = types.ModuleType("server.notificaciones_pb2")
pb2_grpc = types.ModuleType("server.notificaciones_pb2_grpc")
pb2_grpc.add_NotificacionesServiceServicer_to_server = MagicMock()

import server as _server_pkg
_server_pkg.notificaciones_pb2 = pb2
_server_pkg.notificaciones_pb2_grpc = pb2_grpc

sys.modules["server.notificaciones_pb2"] = pb2
sys.modules["server.notificaciones_pb2_grpc"] = pb2_grpc

from server.grpc_server import CompositeServicer, GrpcServer, METODOS_LOG


class TestCompositeServicer:
    def setup_method(self):
        self.notif_ctrl = MagicMock()
        self.log_ctrl = MagicMock()
        self.servicer = CompositeServicer(self.notif_ctrl, self.log_ctrl)

    def test_log_methods_delegan_a_log_controller(self):
        for name in METODOS_LOG:
            assert getattr(self.servicer, name) == getattr(self.log_ctrl, name)

    def test_notificacion_methods_delegan_a_notif_controller(self):
        for name in ["EnviarNotificacionRegistro", "EnviarNotificacionContenidoNuevo",
                      "EnviarNotificacionAvisoGeneral", "ConsultarNotificaciones"]:
            assert getattr(self.servicer, name) == getattr(self.notif_ctrl, name)


class TestGrpcServer:
    @patch("server.grpc_server.get_config")
    @patch("server.grpc_server.grpc.server")
    def test_start(self, mock_grpc_server, mock_get_config):
        mock_get_config.return_value = MagicMock(GRPC_PORT=50051)
        server_instance = MagicMock()
        mock_grpc_server.return_value = server_instance

        srv = GrpcServer(MagicMock(), MagicMock())
        result = srv.start()

        assert result is server_instance
        server_instance.add_insecure_port.assert_called_once_with("[::]:50051")
        server_instance.start.assert_called_once()
