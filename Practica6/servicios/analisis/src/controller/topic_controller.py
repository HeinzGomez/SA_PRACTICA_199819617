from server import analisis_pb2 as pb2
from server import analisis_pb2_grpc as pb2_grpc

from models.topic import (
    ConsultarTemasParams,
    ConsultarUnidadesParams,
    EditarTemaParams,
    EditarUnidadParams,
    RegistrarTemaParams,
    RegistrarUnidadParams,
)


class TopicController(pb2_grpc.AnalisisServiceServicer):
    def __init__(self, topic_service):
        self.topic_service = topic_service

    def CrearUnidad(self, request, context):
        try:
            unidad = self.topic_service.crear_unidad(
                RegistrarUnidadParams(
                    nombre=request.nombre,
                    descripcion=request.descripcion or None,
                )
            )
            return pb2.CrearUnidadResponse(
                exito=True,
                mensaje="Unidad creada",
                unidad=_to_pb_unidad(unidad),
            )
        except Exception as exc:
            return pb2.CrearUnidadResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EditarUnidad(self, request, context):
        try:
            unidad = self.topic_service.editar_unidad(
                EditarUnidadParams(
                    id_unidad=request.id_unidad,
                    nombre=request.nombre,
                    descripcion=request.descripcion or None,
                )
            )
            return pb2.EditarUnidadResponse(
                exito=True,
                mensaje="Unidad editada",
                unidad=_to_pb_unidad(unidad),
            )
        except Exception as exc:
            return pb2.EditarUnidadResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EliminarUnidad(self, request, context):
        try:
            self.topic_service.eliminar_unidad(request.id_unidad)
            return pb2.EliminarUnidadResponse(
                exito=True,
                mensaje="Unidad eliminada",
            )
        except Exception as exc:
            return pb2.EliminarUnidadResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarUnidades(self, request, context):
        try:
            resultado = self.topic_service.consultar_unidades(
                ConsultarUnidadesParams(pagina=1)
            )
            return pb2.ConsultarUnidadesResponse(
                exito=True,
                mensaje="Unidades consultadas",
                unidades=[
                    _to_pb_unidad(unidad) for unidad in resultado.registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarUnidadesResponse(
                exito=False,
                mensaje=str(exc),
            )

    def CrearTema(self, request, context):
        try:
            tema = self.topic_service.crear_tema(
                RegistrarTemaParams(
                    id_unidad=request.id_unidad,
                    nombre=request.nombre,
                    descripcion=request.descripcion or None,
                )
            )
            return pb2.CrearTemaResponse(
                exito=True,
                mensaje="Tema creado",
                tema=_to_pb_tema(tema),
            )
        except Exception as exc:
            return pb2.CrearTemaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EditarTema(self, request, context):
        try:
            tema = self.topic_service.editar_tema(
                EditarTemaParams(
                    id_tema=request.id_tema,
                    id_unidad=request.id_unidad,
                    nombre=request.nombre,
                    descripcion=request.descripcion or None,
                )
            )
            return pb2.EditarTemaResponse(
                exito=True,
                mensaje="Tema editado",
                tema=_to_pb_tema(tema),
            )
        except Exception as exc:
            return pb2.EditarTemaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EliminarTema(self, request, context):
        try:
            self.topic_service.eliminar_tema(request.id_tema)
            return pb2.EliminarTemaResponse(
                exito=True,
                mensaje="Tema eliminado",
            )
        except Exception as exc:
            return pb2.EliminarTemaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarTemas(self, request, context):
        try:
            resultado = self.topic_service.consultar_temas(
                ConsultarTemasParams(
                    pagina=1,
                    id_unidad=request.id_unidad,
                )
            )
            return pb2.ConsultarTemasResponse(
                exito=True,
                mensaje="Temas consultados",
                temas=[
                    _to_pb_tema(tema) for tema in resultado.registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarTemasResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_unidad(unidad) -> pb2.Unidad:
    return pb2.Unidad(
        id_unidad=unidad.id_unidad,
        nombre=unidad.nombre,
        descripcion=unidad.descripcion or "",
    )


def _to_pb_tema(tema) -> pb2.Tema:
    return pb2.Tema(
        id_tema=tema.id_tema,
        id_unidad=tema.id_unidad,
        nombre=tema.nombre,
        descripcion=tema.descripcion or "",
        unidad="",
    )
