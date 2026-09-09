import sys
import types
import pytest
from unittest.mock import MagicMock, patch

# Mock grpc first
if "grpc" not in sys.modules:
    sys.modules["grpc"] = MagicMock()

# Mock the pb2 sub-modules BEFORE importing grpc_server
pb2 = types.ModuleType("server.analisis_pb2")
pb2_grpc = types.ModuleType("server.analisis_pb2_grpc")
pb2_grpc.add_AnalisisServiceServicer_to_server = MagicMock()

# Inject into the server package's namespace
import server as _server_pkg
_server_pkg.analisis_pb2 = pb2
_server_pkg.analisis_pb2_grpc = pb2_grpc

sys.modules["server.analisis_pb2"] = pb2
sys.modules["server.analisis_pb2_grpc"] = pb2_grpc

from server.grpc_server import CompositeServicer, GrpcServer, METODOS_TOPIC, METODOS_CLASS, METODOS_ASSIGN, METODOS_RATING, METODOS_LOG


class TestCompositeServicer:
    def setup_method(self):
        self.topic = MagicMock()
        self.cls = MagicMock()
        self.assign = MagicMock()
        self.rating = MagicMock()
        self.log = MagicMock()
        self.servicer = CompositeServicer(self.topic, self.cls, self.assign, self.rating, self.log)

    def test_topic_methods(self):
        for name in METODOS_TOPIC:
            assert getattr(self.servicer, name) == getattr(self.topic, name)

    def test_class_methods(self):
        for name in METODOS_CLASS:
            assert getattr(self.servicer, name) == getattr(self.cls, name)

    def test_assign_methods(self):
        for name in METODOS_ASSIGN:
            assert getattr(self.servicer, name) == getattr(self.assign, name)

    def test_rating_methods(self):
        for name in METODOS_RATING:
            assert getattr(self.servicer, name) == getattr(self.rating, name)

    def test_log_methods(self):
        for name in METODOS_LOG:
            assert getattr(self.servicer, name) == getattr(self.log, name)

    def test_unknown_method_raises(self):
        with pytest.raises(AttributeError, match="no está registrado"):
            self.servicer.MetodoInexistente


class TestGrpcServer:
    @patch("server.grpc_server.get_config")
    @patch("server.grpc_server.grpc.server")
    def test_start(self, mock_grpc_server, mock_get_config):
        mock_get_config.return_value = MagicMock(GRPC_PORT=50051)
        server_instance = MagicMock()
        mock_grpc_server.return_value = server_instance

        srv = GrpcServer(MagicMock(), MagicMock(), MagicMock(), MagicMock(), MagicMock())
        result = srv.start()

        assert result is server_instance
        server_instance.add_insecure_port.assert_called_once_with("[::]:50051")
        server_instance.start.assert_called_once()
