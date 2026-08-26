from concurrent import futures

import grpc

from config.environment import get_config
from server import analisis_pb2_grpc as pb2_grpc

METODOS_TOPIC = {
    "CrearUnidad",
    "EditarUnidad",
    "EliminarUnidad",
    "ConsultarUnidades",
    "CrearTema",
    "EditarTema",
    "EliminarTema",
    "ConsultarTemas",
}

METODOS_CLASS = {
    "CrearClaseGrabada",
    "EditarClaseGrabada",
    "EliminarClaseGrabada",
    "ConsultarCatalogoClases",
    "CargaMasivaClases",
}

METODOS_ASSIGN = {
    "AsignarTemaClaseGrabada",
    "DesasignarTemaClaseGrabada",
}

METODOS_RATING = {
    "VisualizarClase",
    "CalificarClase",
    "ConsultarCalificacionUsuario",
    "ConsultarClasesMasVistas",
    "ConsultarTemasTendencia",
    "ConsultarRankingValoradas",
}

METODOS_LOG = {"ConsultarAuditLogs"}


class CompositeServicer:
    def __init__(
        self,
        topic_controller,
        class_controller,
        assign_controller,
        rating_controller,
        log_controller,
    ):
        self.topic_controller = topic_controller
        self.class_controller = class_controller
        self.assign_controller = assign_controller
        self.rating_controller = rating_controller
        self.log_controller = log_controller

    def __getattr__(self, name: str):
        if name in METODOS_TOPIC:
            return getattr(self.topic_controller, name)
        if name in METODOS_CLASS:
            return getattr(self.class_controller, name)
        if name in METODOS_ASSIGN:
            return getattr(self.assign_controller, name)
        if name in METODOS_RATING:
            return getattr(self.rating_controller, name)
        if name in METODOS_LOG:
            return getattr(self.log_controller, name)
        raise AttributeError(
            f"El método gRPC '{name}' no está registrado en ningún controller"
        )


class GrpcServer:
    def __init__(
        self,
        topic_controller,
        class_controller,
        assign_controller,
        rating_controller,
        log_controller,
    ):
        self.topic_controller = topic_controller
        self.class_controller = class_controller
        self.assign_controller = assign_controller
        self.rating_controller = rating_controller
        self.log_controller = log_controller

    def start(self) -> grpc.Server:
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        servicer = CompositeServicer(
            self.topic_controller,
            self.class_controller,
            self.assign_controller,
            self.rating_controller,
            self.log_controller,
        )
        pb2_grpc.add_AnalisisServiceServicer_to_server(servicer, server)

        port = get_config().GRPC_PORT
        server.add_insecure_port(f"[::]:{port}")
        server.start()
        return server
