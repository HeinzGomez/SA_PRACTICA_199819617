from typing import List

from config.email import send_email
from config.logger import get_logger
from models.notification import (
    ConsultarNotificacionesParams,
    ConsultarNotificacionesResult,
    Notificacion,
    RegistrarNotificacionParams,
)
from repositories.notification_repository import NotificationRepository
from services.email_service import EmailService

_logger = get_logger("notificaciones.service")

TIPO_REGISTRO = "REGISTRO"
TIPO_CONTENIDO_NUEVO = "CONTENIDO_NUEVO"
TIPO_AVISO_GENERAL = "AVISO_GENERAL"


class NotificationService:
    def __init__(
        self,
        repository: NotificationRepository,
        email_service: EmailService,
    ):
        self.repository = repository
        self.email_service = email_service

    def enviar_registro(
        self, id_usuario: int, correo: str, nombre_usuario: str
    ) -> Notificacion:
        titulo = f"¡Bienvenido, {nombre_usuario}!"
        cuerpo = (
            f"Hola {nombre_usuario}, tu cuenta ha sido creada "
            "exitosamente. ¡Nos alegra tenerte con nosotros!"
        )
        plantilla = self.email_service.plantilla_registro(nombre_usuario)
        send_email([correo], titulo, plantilla)

        notificacion = self.repository.registrar_notificacion(
            RegistrarNotificacionParams(
                id_usuario=id_usuario,
                tipo=TIPO_REGISTRO,
                asunto=titulo,
                mensaje=cuerpo,
            )
        )
        _logger.info(
            "Registro persistido (id_notificacion=%s, id_usuario=%s)",
            notificacion.id_notificacion,
            id_usuario,
        )
        return notificacion

    def enviar_contenido_nuevo(
        self,
        id_usuario: int,
        correos: List[str],
        titulo_contenido: str,
        descripcion: str,
    ) -> ConsultarNotificacionesResult:
        titulo = f"Nuevo contenido disponible: {titulo_contenido}"
        cuerpo = descripcion or (
            f"Se ha publicado nuevo contenido: {titulo_contenido}. "
            "¡Échale un vistazo!"
        )
        plantilla = self.email_service.plantilla_contenido_nuevo(
            titulo_contenido, descripcion
        )
        send_email(correos, titulo, plantilla)

        notificaciones: List[Notificacion] = []
        for correo in correos:
            notificaciones.append(
                self.repository.registrar_notificacion(
                    RegistrarNotificacionParams(
                        id_usuario=id_usuario,
                        tipo=TIPO_CONTENIDO_NUEVO,
                        asunto=titulo,
                        mensaje=cuerpo,
                    )
                )
            )

        return ConsultarNotificacionesResult(
            registros=notificaciones,
            total_paginas=1,
        )

    def enviar_aviso_general(
        self, id_usuario: int, correo: str, asunto: str, mensaje: str
    ) -> Notificacion:
        plantilla = self.email_service.plantilla_aviso_general(asunto, mensaje)
        send_email([correo], asunto, plantilla)

        return self.repository.registrar_notificacion(
            RegistrarNotificacionParams(
                id_usuario=id_usuario,
                tipo=TIPO_AVISO_GENERAL,
                asunto=asunto,
                mensaje=mensaje,
            )
        )

    def consultar_notificaciones(
        self, id_usuario: int, pagina: int
    ) -> ConsultarNotificacionesResult:
        return self.repository.consultar_notificaciones(
            ConsultarNotificacionesParams(
                id_usuario=id_usuario,
                pagina=pagina,
            )
        )
