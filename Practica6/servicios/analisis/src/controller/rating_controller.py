from server import analisis_pb2 as pb2
from server import analisis_pb2_grpc as pb2_grpc

from models.rating import (
    ConsultarClasesMasVistasParams,
    ConsultarRankingValoradasParams,
    ConsultarTemasTendenciaParams,
    RegistrarCalificacionParams,
    RegistrarVisualizacionParams,
)


class RatingController(pb2_grpc.AnalisisServiceServicer):
    def __init__(self, rating_service):
        self.rating_service = rating_service

    def VisualizarClase(self, request, context):
        try:
            clase = self.rating_service.registrar_visualizacion(
                RegistrarVisualizacionParams(id_clase=request.id_clase)
            )
            return pb2.VisualizarClaseResponse(
                exito=True,
                mensaje="Visualización registrada",
                clase=_to_pb_clase_vista(clase),
            )
        except Exception as exc:
            return pb2.VisualizarClaseResponse(
                exito=False,
                mensaje=str(exc),
            )

    def CalificarClase(self, request, context):
        try:
            calificacion = self.rating_service.registrar_calificacion(
                RegistrarCalificacionParams(
                    id_clase=request.id_clase,
                    id_usuario=request.id_usuario,
                    puntuacion=request.puntuacion,
                )
            )
            return pb2.CalificarClaseResponse(
                exito=True,
                mensaje="Calificación registrada",
                promedio_calificacion=float(calificacion.promedio),
            )
        except Exception as exc:
            return pb2.CalificarClaseResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarCalificacionUsuario(self, request, context):
        try:
            calificacion = self.rating_service.consultar_calificacion_usuario(
                request.id_clase, request.id_usuario
            )
            return pb2.ConsultarCalificacionUsuarioResponse(
                exito=True,
                mensaje="Calificación consultada",
                ya_califico=calificacion.puntuacion > 0,
                puntuacion=calificacion.puntuacion,
                promedio_calificacion=float(calificacion.promedio),
                total_calificaciones=calificacion.total_calificaciones,
            )
        except Exception as exc:
            return pb2.ConsultarCalificacionUsuarioResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarClasesMasVistas(self, request, context):
        try:
            registros = self.rating_service.consultar_clases_mas_vistas(
                ConsultarClasesMasVistasParams(
                    fecha_inicio=request.fecha_inicio,
                    fecha_fin=request.fecha_fin,
                    limite=request.limite,
                )
            )
            return pb2.ConsultarClasesMasVistasResponse(
                exito=True,
                mensaje="Clases más vistas consultadas",
                registros=[
                    _to_pb_clase_vista(clase) for clase in registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarClasesMasVistasResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarTemasTendencia(self, request, context):
        try:
            registros = self.rating_service.consultar_temas_tendencia(
                ConsultarTemasTendenciaParams(
                    fecha_inicio=request.fecha_inicio,
                    fecha_fin=request.fecha_fin,
                    limite=request.limite,
                )
            )
            return pb2.ConsultarTemasTendenciaResponse(
                exito=True,
                mensaje="Temas en tendencia consultados",
                registros=[
                    _to_pb_tema_tendencia(tema) for tema in registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarTemasTendenciaResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarRankingValoradas(self, request, context):
        try:
            registros = self.rating_service.consultar_ranking_valoradas(
                ConsultarRankingValoradasParams(limite=request.limite)
            )
            return pb2.ConsultarRankingValoradasResponse(
                exito=True,
                mensaje="Ranking de clases valoradas consultado",
                registros=[
                    _to_pb_clase_valorada(clase) for clase in registros
                ],
            )
        except Exception as exc:
            return pb2.ConsultarRankingValoradasResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_clase_vista(clase) -> pb2.ClaseVista:
    return pb2.ClaseVista(
        id_clase=clase.id_clase,
        titulo=clase.titulo,
        total_visualizaciones=clase.total_visualizaciones,
    )


def _to_pb_tema_tendencia(tema) -> pb2.TemaTendencia:
    return pb2.TemaTendencia(
        id_tema=tema.id_tema,
        nombre=tema.nombre,
        unidad=tema.unidad,
        total_visualizaciones=tema.total_visualizaciones,
    )


def _to_pb_clase_valorada(clase) -> pb2.ClaseValorada:
    return pb2.ClaseValorada(
        id_clase=clase.id_clase,
        titulo=clase.titulo,
        promedio_calificacion=float(clase.promedio),
        total_calificaciones=clase.total_calificaciones,
    )
