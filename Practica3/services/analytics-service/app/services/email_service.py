import uuid

from app.config import settings

TEMPLATES = {
    "NOTIFICATION_REGISTRATION_CONFIRMATION": (
        "Confirmacion de registro - YoUSAC",
        "Hola {full_name}, tu cuenta institucional ha sido registrada exitosamente en YoUSAC.",
    ),
    "NOTIFICATION_NEW_RECORDING_PUBLISHED": (
        "Nueva clase disponible - YoUSAC",
        "Se publico una nueva grabacion para el curso {course_name}: {recording_title}.",
    ),
    "NOTIFICATION_SYSTEM_ALERT": (
        "Aviso del sistema - YoUSAC",
        "{message}",
    ),
}


class EmailService:
    """Envio de correos institucionales (confirmacion de registro, nuevas
    clases publicadas de cursos inscritos y avisos del sistema). Usa SMTP
    configurado via variables de entorno (.env) — nunca hardcodeado."""

    @staticmethod
    async def send(institutional_email: str, notification_type: str, template_data: dict) -> str:
        subject_tpl, body_tpl = TEMPLATES.get(
            notification_type, ("Notificacion YoUSAC", "{message}")
        )
        subject = subject_tpl
        body = body_tpl.format(**{**template_data})

        message_id = str(uuid.uuid4())

        # NOTA: en produccion se envia via aiosmtplib usando settings.smtp_*.
        # Se deja como stub explicito para que el equipo conecte sus
        # credenciales SMTP institucionales sin exponerlas en el codigo.
        print(f"[analytics-service] (stub) Enviando correo a {institutional_email}: '{subject}' -> {body}")

        return message_id
