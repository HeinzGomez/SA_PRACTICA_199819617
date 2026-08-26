from concurrent import futures

import grpc

from config.environment import get_config
from server import notificaciones_pb2_grpc as pb2_grpc

METODOS_LOG = {"ConsultarAuditLogs"}


class CompositeServicer:
    def __init__(self, notification_controller, log_controller):
        self.notification_controller = notification_controller
        self.log_controller = log_controller

    def __getattr__(self, name: str):
        if name in METODOS_LOG:
            return getattr(self.log_controller, name)
        return getattr(self.notification_controller, name)


class GrpcServer:
    def __init__(self, notification_controller, log_controller):
        self.notification_controller = notification_controller
        self.log_controller = log_controller

    def start(self) -> grpc.Server:
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        servicer = CompositeServicer(
            self.notification_controller, self.log_controller
        )
        pb2_grpc.add_NotificacionesServiceServicer_to_server(servicer, server)

        port = get_config().GRPC_PORT
        server.add_insecure_port(f"[::]:{port}")
        server.start()
        return server
