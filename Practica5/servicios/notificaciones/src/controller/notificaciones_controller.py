from config.logger import get_logger
from server import notificaciones_pb2 as pb2
from server import notificaciones_pb2_grpc as pb2_grpc

_logger = get_logger("notificaciones.controller")


class NotificacionesController(pb2_grpc.NotificacionesServiceServicer):
    def __init__(self, service):
        self.service = service

    def EnviarNotificacionRegistro(self, request, context):
        _logger.info(
            "EnviarNotificacionRegistro recibido (id_usuario=%s, correo=%s)",
            request.id_usuario,
            request.correo,
        )
        try:
            notificacion = self.service.enviar_registro(
                id_usuario=request.id_usuario,
                correo=request.correo,
                nombre_usuario=request.nombre_usuario,
            )
            _logger.info(
                "EnviarNotificacionRegistro exitoso (id_notificacion=%s)",
                notificacion.id_notificacion,
            )
            return pb2.EnviarNotificacionRegistroResponse(
                exito=True,
                mensaje="Notificación de registro enviada",
                notificacion=_to_pb_notificacion(notificacion),
            )
        except Exception as exc:
            _logger.exception("EnviarNotificacionRegistro falló: %s", exc)
            return pb2.EnviarNotificacionRegistroResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EnviarNotificacionContenidoNuevo(self, request, context):
        _logger.info(
            "EnviarNotificacionContenidoNuevo recibido (id_usuario=%s, destinatarios=%d)",
            request.id_usuario,
            len(request.correos),
        )
        try:
            resultado = self.service.enviar_contenido_nuevo(
                id_usuario=request.id_usuario,
                correos=list(request.correos),
                titulo_contenido=request.titulo_contenido,
                descripcion=request.descripcion,
            )
            _logger.info(
                "EnviarNotificacionContenidoNuevo exitoso (%d notificaciones)",
                len(resultado.registros),
            )
            return pb2.EnviarNotificacionContenidoNuevoResponse(
                exito=True,
                mensaje="Notificación de contenido nuevo enviada",
                destinatarios=len(resultado.registros),
                notificaciones=[
                    _to_pb_notificacion(n) for n in resultado.registros
                ],
            )
        except Exception as exc:
            _logger.exception("EnviarNotificacionContenidoNuevo falló: %s", exc)
            return pb2.EnviarNotificacionContenidoNuevoResponse(
                exito=False,
                mensaje=str(exc),
            )

    def EnviarNotificacionAvisoGeneral(self, request, context):
        _logger.info(
            "EnviarNotificacionAvisoGeneral recibido (id_usuario=%s, correo=%s)",
            request.id_usuario,
            request.correo,
        )
        try:
            notificacion = self.service.enviar_aviso_general(
                id_usuario=request.id_usuario,
                correo=request.correo,
                asunto=request.asunto,
                mensaje=request.mensaje,
            )
            _logger.info(
                "EnviarNotificacionAvisoGeneral exitoso (id_notificacion=%s)",
                notificacion.id_notificacion,
            )
            return pb2.EnviarNotificacionAvisoGeneralResponse(
                exito=True,
                mensaje="Aviso general enviado",
                notificacion=_to_pb_notificacion(notificacion),
            )
        except Exception as exc:
            _logger.exception("EnviarNotificacionAvisoGeneral falló: %s", exc)
            return pb2.EnviarNotificacionAvisoGeneralResponse(
                exito=False,
                mensaje=str(exc),
            )

    def ConsultarNotificaciones(self, request, context):
        _logger.info(
            "ConsultarNotificaciones recibido (id_usuario=%s, pagina=%s)",
            request.id_usuario,
            request.pagina,
        )
        try:
            resultado = self.service.consultar_notificaciones(
                id_usuario=request.id_usuario,
                pagina=request.pagina,
            )
            _logger.info(
                "ConsultarNotificaciones exitoso (%d registros)",
                len(resultado.registros),
            )
            return pb2.ConsultarNotificacionesResponse(
                exito=True,
                mensaje="Consulta exitosa",
                registros=[
                    _to_pb_notificacion(n) for n in resultado.registros
                ],
                total_paginas=resultado.total_paginas,
            )
        except Exception as exc:
            _logger.exception("ConsultarNotificaciones falló: %s", exc)
            return pb2.ConsultarNotificacionesResponse(
                exito=False,
                mensaje=str(exc),
            )


def _to_pb_notificacion(notificacion) -> pb2.Notificacion:
    return pb2.Notificacion(
        id_notificacion=notificacion.id_notificacion,
        id_usuario=notificacion.id_usuario,
        tipo=notificacion.tipo,
        asunto=notificacion.asunto,
        mensaje=notificacion.mensaje,
        fecha_envio=notificacion.fecha_envio,
        estado=notificacion.estado,
    )
