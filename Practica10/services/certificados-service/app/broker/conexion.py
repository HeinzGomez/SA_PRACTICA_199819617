"""HeinzGomez - Práctica 9: conexión y topología RabbitMQ del Servicio de Certificados.

	exchange  academix.events (topic, durable)   [sin cambios respecto de la versión anterior]
	  reserva.confirmada -> queue certificados.inscripciones (consumidor: este servicio)
	exchange  academix.rpc (direct, durable)     [nuevo: peticiones del API Gateway]
	  certificados.*     -> queue certificados.rpc -> replyTo (ACK tras confirmar la respuesta)
	  NACK sin reencolar -> queue certificados.rpc.dlq  (DLX academix.dlx.certificados)

El DLX del RPC es propio para no cruzar mensajes con la DLQ de las inscripciones.
"""
from __future__ import annotations

import logging
import time
from typing import Iterable

log = logging.getLogger("certificados.broker")

EXCHANGE_EVENTOS = "academix.events"
COLA_INSCRIPCIONES = "certificados.inscripciones"
RK_RESERVA_CONFIRMADA = "reserva.confirmada"
PREFETCH_INSCRIPCIONES = 50

EXCHANGE_RPC = "academix.rpc"
COLA_RPC = "certificados.rpc"
COLA_RPC_DLQ = "certificados.rpc.dlq"
EXCHANGE_RPC_MUERTOS = "academix.dlx.certificados"

ESPERA_RECONEXION = 3


def conectar(url: str):
    """Un único intento de conexión. Quien llama decide cuándo reintentar."""
    import pika

    return pika.BlockingConnection(pika.URLParameters(url))


def declarar_eventos(ch) -> None:
    ch.exchange_declare(EXCHANGE_EVENTOS, exchange_type="topic", durable=True)
    ch.queue_declare(COLA_INSCRIPCIONES, durable=True)
    ch.queue_bind(COLA_INSCRIPCIONES, EXCHANGE_EVENTOS, routing_key=RK_RESERVA_CONFIRMADA)
    ch.basic_qos(prefetch_count=PREFETCH_INSCRIPCIONES)


def declarar_rpc(ch, operaciones: Iterable[str]) -> None:
    ch.exchange_declare(EXCHANGE_RPC_MUERTOS, exchange_type="fanout", durable=True)
    ch.queue_declare(COLA_RPC_DLQ, durable=True)
    ch.queue_bind(COLA_RPC_DLQ, EXCHANGE_RPC_MUERTOS)
    ch.queue_declare(COLA_RPC, durable=True, arguments={
        "x-dead-letter-exchange": EXCHANGE_RPC_MUERTOS,
        "x-dead-letter-routing-key": COLA_RPC_DLQ,
    })
    ch.exchange_declare(EXCHANGE_RPC, exchange_type="direct", durable=True)
    for rk in operaciones:
        ch.queue_bind(COLA_RPC, EXCHANGE_RPC, routing_key=rk)


def reintentar(url: str, conectar_con, *args):
    """Bucle de reconexión: nadie se cae si RabbitMQ está reiniciando."""
    while True:
        try:
            return conectar_con(url, *args)
        except Exception as e:  # noqa: BLE001 - el broker no debe tumbar el servicio
            log.warning("RabbitMQ no disponible (%s); reintentando en %ss", e, ESPERA_RECONEXION)
            time.sleep(ESPERA_RECONEXION)
