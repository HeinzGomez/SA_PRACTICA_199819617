import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

from .environment import get_config
from .logger import get_logger

_logger = get_logger("notificaciones.email")


def _build_message(to: List[str], subject: str, body: str) -> MIMEMultipart:
    cfg = get_config()

    message = MIMEMultipart("alternative")
    message["From"] = cfg.FROM_SMTP
    message["To"] = ", ".join(to)
    message["Subject"] = subject
    message.attach(MIMEText(body, "html", "utf-8"))

    return message


def send_email(to: List[str], subject: str, body: str) -> None:
    cfg = get_config()

    message = _build_message(to, subject, body)

    _logger.info(
        "Enviando correo (destinatarios=%s, asunto=%s, host=%s:%s)",
        to,
        subject,
        cfg.HOST_SMTP,
        cfg.PORT_SMTP,
    )
    try:
        with smtplib.SMTP(cfg.HOST_SMTP, cfg.PORT_SMTP) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg.FROM_SMTP, cfg.PASS_SMTP)
            server.sendmail(cfg.FROM_SMTP, to, message.as_string())
        _logger.info("Correo enviado correctamente (destinatarios=%s)", to)
    except Exception:
        _logger.exception("Error al enviar el correo (destinatarios=%s)", to)
        raise
