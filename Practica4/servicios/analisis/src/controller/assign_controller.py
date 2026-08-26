from server import analisis_pb2 as pb2
from server import analisis_pb2_grpc as pb2_grpc

from models.assign import AsignarTemaClaseParams, DesasignarTemaClaseParams


class AssignController(pb2_grpc.AnalisisServiceServicer):
    def __init__(self, assign_service):
        self.assign_service = assign_service

    def AsignarTemaClaseGrabada(self, request, context):
        try:
            self.assign_service.asignar_tema_clase(
                AsignarTemaClaseParams(
                    id_clase=request.id_clase,
                    id_tema=request.id_tema,
                )
            )
            return pb2.AsignarTemaClaseGrabadaResponse(
                exito=True,
                mensaje="Tema asignado a la clase",
            )
        except Exception as exc:
            return pb2.AsignarTemaClaseGrabadaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def DesasignarTemaClaseGrabada(self, request, context):
        try:
            self.assign_service.desasignar_tema_clase(
                DesasignarTemaClaseParams(
                    id_clase=request.id_clase,
                    id_tema=request.id_tema,
                )
            )
            return pb2.DesasignarTemaClaseGrabadaResponse(
                exito=True,
                mensaje="Tema desasignado de la clase",
            )
        except Exception as exc:
            return pb2.DesasignarTemaClaseGrabadaResponse(
                exito=False,
                mensaje=str(exc),
            )
