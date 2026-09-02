from server import analisis_pb2 as pb2
from server import analisis_pb2_grpc as pb2_grpc

from models.batch import ClaseCargaInput
from models.clase import (
    ConsultarCatalogoParams,
    EditarClaseParams,
    RegistrarClaseParams,
)


class ClassController(pb2_grpc.AnalisisServiceServicer):
    def __init__(self, class_service):
        self.class_service = class_service

    def CrearClaseGrabada(self, request, context):
        try:
            clase = self.class_service.crear_clase(
                RegistrarClaseParams(
                    id_curso=request.id_curso,
                    id_periodo=request.id_periodo,
                    id_area=request.id_area,
                    titulo=request.titulo,
                    fecha_impartida=request.fecha_impartida,
                    duracion=request.duracion_min,
                    descripcion=request.descripcion or None,
                    url_video=request.url_video,
                    anio=request.anio,
                    num_semestre=request.num_semestre,
                )
            )
            return pb2.CrearClaseGrabadaResponse(
                exito=True,
                mensaje="Clase grabada creada",
                clase=_to_pb_clase(clase),
            )
        except Exception as exc:
            return pb2.CrearClaseGrabadaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EditarClaseGrabada(self, request, context):
        try:
            clase = self.class_service.editar_clase(
                EditarClaseParams(
                    id_clase=request.id_clase,
                    id_curso=request.id_curso,
                    id_periodo=request.id_periodo,
                    id_area=request.id_area,
                    titulo=request.titulo,
                    fecha_impartida=request.fecha_impartida,
                    duracion=request.duracion_min,
                    descripcion=request.descripcion or None,
                    url_video=request.url_video,
                    anio=request.anio,
                    num_semestre=request.num_semestre,
                )
            )
            return pb2.EditarClaseGrabadaResponse(
                exito=True,
                mensaje="Clase grabada editada",
                clase=_to_pb_clase(clase),
            )
        except Exception as exc:
            return pb2.EditarClaseGrabadaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EliminarClaseGrabada(self, request, context):
        try:
            self.class_service.eliminar_clase(request.id_clase)
            return pb2.EliminarClaseGrabadaResponse(
                exito=True,
                mensaje="Clase grabada eliminada",
            )
        except Exception as exc:
            return pb2.EliminarClaseGrabadaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarCatalogoClases(self, request, context):
        try:
            resultado = self.class_service.consultar_catalogo(
                ConsultarCatalogoParams(pagina=1)
            )
            return pb2.ConsultarCatalogoClasesResponse(
                exito=True,
                mensaje="Catálogo consultado",
                registros=[
                    _to_pb_catalogo(clase) for clase in resultado.registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarCatalogoClasesResponse(
                exito=False,
                mensaje=str(exc),
            )

    def CargaMasivaClases(self, request, context):
        try:
            clases = [
                ClaseCargaInput(
                    id_curso=item.id_curso,
                    id_periodo=item.id_periodo,
                    id_area=item.id_area,
                    titulo=item.titulo,
                    fecha_impartida=item.fecha_impartida,
                    duracion_min=item.duracion_min,
                    descripcion=item.descripcion or None,
                    url_video=item.url_video or None,
                    anio=item.anio or None,
                    num_semestre=item.num_semestre or None,
                )
                for item in request.clases
            ]
            respuesta = self.class_service.carga_masiva_clases(clases)
            return pb2.BatchCrearClaseResponse(
                exito=respuesta.exito,
                mensaje=respuesta.mensaje,
                resultados=[
                    _to_pb_batch_result(r) for r in respuesta.resultados
                ],
            )
        except Exception as exc:
            return pb2.BatchCrearClaseResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_clase(clase) -> pb2.ClaseGrabada:
    return pb2.ClaseGrabada(
        id_clase=clase.id_clase,
        id_curso=clase.id_curso,
        id_periodo=clase.id_periodo,
        id_area=clase.id_area,
        titulo=clase.titulo,
        fecha_impartida=clase.fecha_impartida,
        duracion_min=clase.duracio_min,
        descripcion=clase.descripcion or "",
        url_video=clase.url_video,
        anio=clase.anio,
        num_semestre=clase.num_semestre,
    )


def _to_pb_catalogo(clase) -> pb2.CatalogoClase:
    return pb2.CatalogoClase(
        id_clase=clase.id_clase,
        titulo=clase.titulo,
        descripcion=clase.descripcion or "",
        fecha_impartida=clase.fecha_impartida,
        duracion_min=clase.duracio_min,
        url_video=clase.url_video,
        anio=clase.anio,
        num_semestre=clase.num_semestre,
        id_curso=clase.id_curso,
        id_area=clase.id_area,
        id_periodo=clase.id_periodo,
    )


def _to_pb_batch_result(result) -> pb2.BatchCrearClaseResult:
    return pb2.BatchCrearClaseResult(
        index=result.index,
        exito=result.status == "ok",
        mensaje=result.message or "",
        id_clase=result.id_clase or 0,
    )
