"""HeinzGomez - Práctica 10: pruebas del logging estructurado (JSON por stdout)."""
from __future__ import annotations

import io
import json
import logging
import sys

from app.observabilidad.logging_json import FormateadorJSON, configurar_logging


def _registro(nivel: int = logging.INFO, mensaje: str = "atiendo %s", args=("certificados.rpc",),
              exc_info=None) -> logging.LogRecord:
    return logging.LogRecord("certificados.rpc", nivel, "rpc.py", 10, mensaje, args, exc_info)


def test_formateador_emite_un_json_por_linea_con_el_sello_del_servicio():
    documento = json.loads(FormateadorJSON(version_servicio="9.9.9").format(_registro()))
    assert documento["nivel"] == "INFO"
    assert documento["mensaje"] == "atiendo certificados.rpc"
    assert documento["logger"] == "certificados.rpc"
    assert documento["servicio"] == "certificados-service"
    assert documento["version"] == "9.9.9"
    assert documento["timestamp"].endswith("Z")


def test_formateador_toma_la_version_del_entorno(monkeypatch):
    monkeypatch.setenv("SERVICE_VERSION", "2.0.0")
    assert json.loads(FormateadorJSON().format(_registro()))["version"] == "2.0.0"


def test_formateador_incluye_la_excepcion_cuando_la_hay():
    try:
        raise ValueError("roto")
    except ValueError:
        registro = _registro(logging.ERROR, "fallo", (), sys.exc_info())
    documento = json.loads(FormateadorJSON().format(registro))
    assert documento["nivel"] == "ERROR"
    assert "ValueError: roto" in documento["error"]


def test_formateador_sobrevive_a_un_mensaje_con_caracteres_especiales():
    registro = _registro(mensaje="sin %s: no hay dónde responder", args=("reply_to",))
    assert json.loads(FormateadorJSON().format(registro))["mensaje"] == "sin reply_to: no hay dónde responder"


def test_configurar_logging_escribe_json_en_el_destino_dado():
    destino = io.StringIO()
    anteriores = logging.getLogger().handlers[:]
    nivel_anterior = logging.getLogger().level
    try:
        raiz = configurar_logging("info", destino)
        logging.getLogger("certificados.broker").info("conectado a RabbitMQ")
        assert raiz.level == logging.INFO
        documento = json.loads(destino.getvalue().strip().splitlines()[-1])
        assert documento["mensaje"] == "conectado a RabbitMQ"
        assert documento["logger"] == "certificados.broker"
    finally:
        logging.getLogger().handlers[:] = anteriores
        logging.getLogger().setLevel(nivel_anterior)


def test_configurar_logging_respeta_log_level_del_entorno(monkeypatch):
    monkeypatch.setenv("LOG_LEVEL", "debug")
    anteriores = logging.getLogger().handlers[:]
    nivel_anterior = logging.getLogger().level
    try:
        assert configurar_logging(destino=io.StringIO()).level == logging.DEBUG
    finally:
        logging.getLogger().handlers[:] = anteriores
        logging.getLogger().setLevel(nivel_anterior)
