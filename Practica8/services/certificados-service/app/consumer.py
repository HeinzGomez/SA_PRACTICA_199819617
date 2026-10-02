"""HeinzGomez - Práctica 7: consumidor RabbitMQ de "reserva.confirmada" -> tabla inscripcion."""
from __future__ import annotations

import json
import logging
import time

from .domain import CertificadosError

log = logging.getLogger("certificados.consumer")

EXCHANGE = "academix.events"
QUEUE = "certificados.inscripciones"


def procesar_mensaje(svc, body: bytes) -> bool:
    """Devuelve True si el mensaje debe confirmarse (ack) y False si va a descartarse (nack)."""
    try:
        svc.registrar_inscripcion(json.loads(body))
        return True
    except (ValueError, CertificadosError) as e:
        log.warning("mensaje descartado: %s", e)
        return False


def iniciar(url: str, svc) -> None:  # pragma: no cover - requiere RabbitMQ real
    import pika

    while True:
        try:
            conn = pika.BlockingConnection(pika.URLParameters(url))
            ch = conn.channel()
            ch.exchange_declare(EXCHANGE, exchange_type="topic", durable=True)
            ch.queue_declare(QUEUE, durable=True)
            ch.queue_bind(QUEUE, EXCHANGE, routing_key="reserva.confirmada")
            ch.basic_qos(prefetch_count=50)

            def cb(channel, method, _props, body):
                if procesar_mensaje(svc, body):
                    channel.basic_ack(method.delivery_tag)
                else:
                    channel.basic_nack(method.delivery_tag, requeue=False)

            ch.basic_consume(QUEUE, cb)
            log.info("consumiendo %s", QUEUE)
            ch.start_consuming()
        except Exception as e:  # reconexión
            log.warning("RabbitMQ no disponible (%s); reintentando en 3s", e)
            time.sleep(3)
