"""HeinzGomez - Práctica 9: pruebas del adaptador RabbitMQ (conexión, consumidor y cola RPC).

Ninguna prueba abre un socket: la topología se verifica con un canal doble y la conexión
se verifica con un `pika` falso inyectado en `sys.modules`.
"""
from __future__ import annotations

import json
import sys
import types
from types import SimpleNamespace

import pytest

from app.broker import consumidor, rpc
from app.broker.conexion import (COLA_INSCRIPCIONES, COLA_RPC, COLA_RPC_DLQ, EXCHANGE_EVENTOS, EXCHANGE_RPC,
                                 EXCHANGE_RPC_MUERTOS, PREFETCH_INSCRIPCIONES, RK_RESERVA_CONFIRMADA,
                                 conectar, declarar_eventos, declarar_rpc, reintentar)
from app.broker.rpc import _al_recibir, _atender, _confirmar
from app.domain import CertificadosError


# ---------- conexión / topología
class _CanalRegistro:
    def __init__(self):
        self.llamadas: list[tuple[str, tuple, dict]] = []

    def exchange_declare(self, *args, **kwargs):
        self.llamadas.append(("exchange_declare", args, kwargs))

    def queue_declare(self, *args, **kwargs):
        self.llamadas.append(("queue_declare", args, kwargs))

    def queue_bind(self, *args, **kwargs):
        self.llamadas.append(("queue_bind", args, kwargs))

    def basic_qos(self, *args, **kwargs):
        self.llamadas.append(("basic_qos", args, kwargs))


def test_conectar_pasa_la_url_a_pika(monkeypatch):
    """conectar() es un solo intento: quien reintenta es reintentar()."""
    modulo = types.ModuleType("pika")
    registro = {}

    def url_parameters(url):
        registro["url"] = url
        return ("parameters", url)

    def blocking_connection(params):
        registro["params"] = params
        return "CONEXION"

    modulo.URLParameters = url_parameters
    modulo.BlockingConnection = blocking_connection
    monkeypatch.setitem(sys.modules, "pika", modulo)

    assert conectar("amqp://usuario:clave@broker:5672/") == "CONEXION"
    assert registro == {"url": "amqp://usuario:clave@broker:5672/",
                        "params": ("parameters", "amqp://usuario:clave@broker:5672/")}


def test_topologia_de_eventos():
    ch = _CanalRegistro()
    declarar_eventos(ch)
    assert ch.llamadas == [
        ("exchange_declare", (EXCHANGE_EVENTOS,), {"exchange_type": "topic", "durable": True}),
        ("queue_declare", (COLA_INSCRIPCIONES,), {"durable": True}),
        ("queue_bind", (COLA_INSCRIPCIONES, EXCHANGE_EVENTOS),
         {"routing_key": RK_RESERVA_CONFIRMADA}),
        ("basic_qos", (), {"prefetch_count": PREFETCH_INSCRIPCIONES}),
    ]


def test_topologia_rpc_con_su_propia_dlq():
    ch = _CanalRegistro()
    declarar_rpc(ch, ["certificados.a", "certificados.b"])

    por_nombre = {(c[0], c[1]): c[2] for c in ch.llamadas}
    assert por_nombre[("exchange_declare", (EXCHANGE_RPC_MUERTOS,))] == {
        "exchange_type": "fanout", "durable": True}
    assert por_nombre[("exchange_declare", (EXCHANGE_RPC,))] == {
        "exchange_type": "direct", "durable": True}
    # la cola RPC muere hacia SU propia DLQ: no cruza mensajes con la de inscripciones
    assert por_nombre[("queue_declare", (COLA_RPC,))] == {
        "durable": True,
        "arguments": {"x-dead-letter-exchange": EXCHANGE_RPC_MUERTOS,
                      "x-dead-letter-routing-key": COLA_RPC_DLQ},
    }
    assert por_nombre[("queue_declare", (COLA_RPC_DLQ,))] == {"durable": True}
    enlaces = [c[2].get("routing_key") for c in ch.llamadas if c[0] == "queue_bind"]
    assert None in enlaces  # la DLQ se enlaza al fanout sin routing key
    assert "certificados.a" in enlaces and "certificados.b" in enlaces


def test_reintentar_hasta_que_el_broker_este_arriba(monkeypatch):
    monkeypatch.setattr("app.broker.conexion.ESPERA_RECONEXION", 0)
    intentos: list = []

    def conectar_con(url, *args):
        intentos.append((url, args))
        if len(intentos) < 3:
            raise ConnectionError("broker reiniciando")
        return "conectado"

    assert reintentar("amqp://r", conectar_con, "extra") == "conectado"
    assert intentos == [("amqp://r", ("extra",)), ("amqp://r", ("extra",)), ("amqp://r", ("extra",))]


def test_reintentar_no_captura_el_ctrl_c_de_la_prueba(monkeypatch):
    """Solo debe tragarse los fallos de conexión, no un KeyboardInterrupt."""
    monkeypatch.setattr("app.broker.conexion.ESPERA_RECONEXION", 0)

    def conectar_con(url):
        raise KeyboardInterrupt

    with pytest.raises(KeyboardInterrupt):
        reintentar("amqp://r", conectar_con)


# ---------- consumidor de eventos
def test_consumidor_registra_y_descarta(svc):
    ok = consumidor.procesar_mensaje(
        svc, b'{"usuarioId":"u2","eventoId":"evt-k8s-01","ticketId":"T"}')
    assert ok is True
    assert svc.repo.esta_inscrito("u2", "evt-k8s-01")
    # JSON roto (ValueError) y mensaje de reserva incompleto (dominio) => nack, sin requeue
    assert consumidor.procesar_mensaje(svc, b"no-json") is False
    assert consumidor.procesar_mensaje(svc, b'{"usuarioId":"u2"}') is False
    assert consumidor.procesar_mensaje(svc, b'{"eventoId":"e"}') is False


def test_consumidor_propaga_lo_que_no_es_un_mensaje_malo():
    """Solo ValueError/CertificadosError se consideran mensajes malos: un fallo real
    (base caída) sube para que el callback de pika decida y no se pierda el evento."""
    class _Roto:
        def registrar_inscripcion(self, mensaje):
            raise RuntimeError("se cayo la base")

    with pytest.raises(RuntimeError):
        consumidor.procesar_mensaje(_Roto(), b"{}")


# ---------- cola RPC: confirmaciones
class _CanalRPC:
    def __init__(self, publicar=None, fallar=False, fallar_al_publicar=False):
        self.ack: list = []
        self.nack: list = []
        self.publicados: list = []
        self._publicar = publicar
        self._fallar = fallar
        self._fallar_al_publicar = fallar_al_publicar

    def basic_ack(self, tag):
        if self._fallar:
            raise RuntimeError("canal cerrado")
        self.ack.append(tag)

    def basic_nack(self, tag, requeue=False):
        if self._fallar:
            raise RuntimeError("canal cerrado")
        self.nack.append((tag, requeue))

    def basic_publish(self, **kw):
        if self._fallar or self._fallar_al_publicar:
            raise RuntimeError("no se pudo publicar")
        self.publicados.append(kw)
        return self._publicar


class _DespachadorFalso:
    operaciones = ["certificados.ok"]

    def __init__(self, respuesta=b'{"ok":true,"datos":1}', error=None):
        self._respuesta = respuesta
        self._error = error

    def despachar(self, operacion, cuerpo):
        if self._error is not None:
            raise self._error
        return self._respuesta


def _metodo(rk="certificados.ok", tag=7):
    return SimpleNamespace(routing_key=rk, delivery_tag=tag)


def _props(reply_to="gateway.reply", correlation_id="c-1"):
    return SimpleNamespace(reply_to=reply_to, correlation_id=correlation_id)


def test_confirmar_hace_ack():
    canal = _CanalRPC()
    _confirmar(canal, 7, confirmar=True)
    assert canal.ack == [7] and not canal.nack


def test_confirmar_hace_nack_sin_reencolar():
    canal = _CanalRPC()
    _confirmar(canal, 9, confirmar=False)
    assert canal.nack == [(9, False)] and not canal.ack


def test_confirmar_no_tumba_el_consumidor_si_el_canal_cayo():
    """RabbitMQ redistribuye el mensaje; el callback no debe reventar."""
    roto = _CanalRPC(fallar=True)
    _confirmar(roto, 1, confirmar=True)
    _confirmar(roto, 2, confirmar=False)
    assert roto.ack == [] and roto.nack == []


# ---------- cola RPC: atender
def test_atender_publica_la_respuesta_y_luego_confirma():
    canal = _CanalRPC(publicar=None)
    _atender(canal, _DespachadorFalso(), _metodo(), _props(), b"{}")
    assert canal.ack == [7] and not canal.nack
    assert len(canal.publicados) == 1
    assert canal.publicados[0]["routing_key"] == "gateway.reply"
    assert canal.publicados[0]["exchange"] == ""
    assert canal.publicados[0]["mandatory"] is True
    assert canal.publicados[0]["properties"].correlation_id == "c-1"
    assert canal.publicados[0]["properties"].delivery_mode == 2
    assert json.loads(canal.publicados[0]["body"]) == {"ok": True, "datos": 1}


def test_atender_con_errores_de_despacho_va_a_la_dlq():
    canal = _CanalRPC()
    _atender(canal, _DespachadorFalso(error=CertificadosError("NOT_FOUND", "no existe")),
             _metodo(), _props(), b"{}")
    assert canal.nack == [(7, False)] and not canal.ack
    assert canal.publicados == []


def test_atender_sin_reply_to_va_a_la_dlq():
    canal = _CanalRPC()
    _atender(canal, _DespachadorFalso(), _metodo(), _props(reply_to=None), b"{}")
    assert canal.nack == [(7, False)] and not canal.ack
    assert canal.publicados == []


def test_atender_si_la_publicacion_falla_no_confirma():
    canal = _CanalRPC(fallar_al_publicar=True)
    _atender(canal, _DespachadorFalso(), _metodo(), _props(), b"{}")
    assert canal.nack == [(7, False)] and not canal.ack
    assert canal.publicados == []


def test_atender_si_el_broker_rechaza_la_respuesta_va_a_la_dlq():
    """Publisher confirms: `basic_publish` devuelve False => la respuesta no llegó."""
    canal = _CanalRPC(publicar=False)
    _atender(canal, _DespachadorFalso(), _metodo(), _props(), b"{}")
    assert canal.nack == [(7, False)] and not canal.ack


def test_al_recibir_tiene_la_firma_de_los_4_argumentos_de_pika():
    """Regresión: pika 1.x invoca el callback con (channel, method, properties, body)."""
    canal = _CanalRPC()
    _al_recibir(_DespachadorFalso(), canal, _metodo(), _props(), b"{}")
    assert canal.ack == [7]


def test_al_recibir_es_un_parcial_listo_para_basic_consume():
    from functools import partial
    parcial = partial(_al_recibir, _DespachadorFalso())
    canal = _CanalRPC()
    parcial(canal, _metodo(tag=3), _props(), b"{}")
    assert canal.ack == [3]
