"""HeinzGomez - Práctica 10: consumidor de "reserva.confirmada" -> tabla inscripcion (ACK/NACK)."""
from __future__ import annotations

import json
import logging
import time
from typing import Optional

from ..domain import CertificadosError
from ..observabilidad.telemetria import Telemetria, TelemetriaNula
from .conexion import COLA_INSCRIPCIONES, conectar, declarar_eventos

log = logging.getLogger("certificados.consumidor")


def procesar_mensaje(svc, body: bytes, telemetria: Optional[Telemetria] = None) -> bool:
    """Devuelve True si el mensaje debe confirmarse (ack) y False si va a descartarse (nack)."""
    t = telemetria or TelemetriaNula()
    try:
        svc.registrar_inscripcion(json.loads(body))
    except (ValueError, CertificadosError) as e:
        t.inscripcion("descartada")
        log.warning("mensaje descartado: %s", e)
        return False
    t.inscripcion("aceptada")
    return True


def iniciar(url: str, svc, telemetria: Optional[Telemetria] = None) -> None:  # pragma: no cover - requiere RabbitMQ real
    t = telemetria or TelemetriaNula()
    while True:
        conn = None
        try:
            conn = conectar(url)
            t.broker(True)
            ch = conn.channel()
            declarar_eventos(ch)

            def cb(channel, method, _props, body):
                try:
                    if procesar_mensaje(svc, body, t):
                        channel.basic_ack(method.delivery_tag)
                    else:
                        channel.basic_nack(method.delivery_tag, requeue=False)
                except Exception as e:  # canal caído: el mensaje se redistribuye solo
                    log.warning("no se pudo confirmar el mensaje: %s", e)

            ch.basic_consume(COLA_INSCRIPCIONES, cb)
            log.info("consumiendo %s", COLA_INSCRIPCIONES)
            ch.start_consuming()
        except Exception as e:  # reconexión
            t.broker(False)
            log.warning("RabbitMQ no disponible (%s); reintentando en 3s", e)
            time.sleep(3)
        finally:
            t.broker(False)
            if conn is not None and conn.is_open:
                try:
                    conn.close()
                except Exception:  # noqa: BLE001
                    pass
