"""HeinzGomez - Práctica 9: cola RPC por la que el API Gateway llama a Certificados
(antes servidor gRPC en el puerto 50054).

	academix.rpc --certificados.*--> certificados.rpc --> replyTo (respuesta confirmada)
	                                     │ ACK recién después de confirmar la publicación
	                                     └─ NACK sin reencolar -> certificados.rpc.dlq
"""
from __future__ import annotations

import logging
import time
from functools import partial
from typing import Protocol

from .conexion import COLA_RPC, conectar, declarar_rpc

log = logging.getLogger("certificados.rpc")


class Despachador(Protocol):
    """Interfaz mínima que el broker necesita del controlador (DIP)."""

    operaciones: list

    def despachar(self, operacion: str, cuerpo: bytes) -> bytes:
        """Devuelve el JSON de la respuesta. Lanza excepción solo si la respuesta
        no pudo construirse: en ese caso el mensaje va a la DLQ, no se pierde."""
        ...


def _confirmar(channel, delivery_tag, confirmar: bool) -> None:
    try:
        if confirmar:
            channel.basic_ack(delivery_tag)
        else:
            channel.basic_nack(delivery_tag, requeue=False)  # a la DLQ
    except Exception as e:  # noqa: BLE001 - canal caído: RabbitMQ redistribuye el mensaje
        log.warning("no se pudo confirmar la entrega: %s", e)


def _atender(channel, despachador: Despachador, metodo, props, cuerpo: bytes) -> None:
    try:
        respuesta = despachador.despachar(metodo.routing_key, cuerpo)
    except Exception as e:  # noqa: BLE001 - operación desconocida u error estructural
        log.warning("%s rechazado: %s", metodo.routing_key, e)
        _confirmar(channel, metodo.delivery_tag, confirmar=False)
        return

    if not props.reply_to:
        log.warning("%s sin reply_to", metodo.routing_key)
        _confirmar(channel, metodo.delivery_tag, confirmar=False)
        return

    import pika  # importado aquí: el servicio puede arrancar sin broker

    try:
        confirmado = channel.basic_publish(
            exchange="",
            routing_key=props.reply_to,
            body=respuesta,
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,
                correlation_id=props.correlation_id,
                reply_to=props.reply_to,
            ),
            mandatory=True,
        )
    except Exception as e:  # noqa: BLE001 - el broker no confirmó la respuesta
        log.warning("no se pudo publicar la respuesta de %s: %s", metodo.routing_key, e)
        _confirmar(channel, metodo.delivery_tag, confirmar=False)
        return

    if confirmado is False:
        log.warning("el broker rechazó la respuesta de %s", metodo.routing_key)
        _confirmar(channel, metodo.delivery_tag, confirmar=False)
        return

    _confirmar(channel, metodo.delivery_tag, confirmar=True)


def _al_recibir(despachador: Despachador, channel, method, properties, body) -> None:
    """Callback de consume de pika 1.x: firma (channel, method, properties, body) -> 4 argumentos."""
    _atender(channel, despachador, method, properties, body)


def iniciar(url: str, prefetch: int, despachador: Despachador) -> None:  # pragma: no cover
    while True:
        conn = None
        try:
            conn = conectar(url)
            ch = conn.channel()
            declarar_rpc(ch, despachador.operaciones)
            ch.basic_qos(prefetch_count=prefetch)
            # publisher confirms: si el broker no responde, la respuesta no se confirma y va a la DLQ
            try:
                ch.confirm_delivery()
            except Exception as e:  # noqa: BLE001 - capability opcional del servidor
                log.info("publisher confirms no disponibles en este broker: %s", e)
            ch.basic_consume(COLA_RPC, partial(_al_recibir, despachador))
            log.info("atiendo %s (prefetch=%s)", COLA_RPC, prefetch)
            ch.start_consuming()
        except Exception as e:  # reconexión
            log.warning("RabbitMQ no disponible (%s); reintentando en 3s", e)
            time.sleep(3)
        finally:
            if conn is not None and conn.is_open:
                try:
                    conn.close()
                except Exception:  # noqa: BLE001
                    pass
