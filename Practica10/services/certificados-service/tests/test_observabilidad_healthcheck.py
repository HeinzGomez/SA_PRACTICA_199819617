"""HeinzGomez - Práctica 10: pruebas de la sonda de liveness del contenedor (sin curl)."""
from __future__ import annotations

import pytest

from app.observabilidad import healthcheck
from app.observabilidad.metricas import Metricas
from app.observabilidad.servidor import ServidorObservabilidad, SondasDeProceso


@pytest.fixture
def puerto_libre() -> int:
    """Un puerto que nadie va a atender: el servidor se levanta y se cae."""
    servidor = ServidorObservabilidad(0, Metricas(), SondasDeProceso(lambda: True, lambda: True))
    servidor.arrancar()
    puerto = servidor.puerto
    servidor.detener()
    return puerto


@pytest.fixture
def puerto_vivo() -> int:
    servidor = ServidorObservabilidad(0, Metricas(), SondasDeProceso(lambda: True, lambda: True))
    servidor.arrancar()
    try:
        yield servidor.puerto
    finally:
        servidor.detener()


def test_verificar_devuelve_true_cuando_health_responde(puerto_vivo):
    assert healthcheck.verificar(puerto_vivo) is True


def test_verificar_devuelve_false_si_nadie_escucha(puerto_libre):
    assert healthcheck.verificar(puerto_libre) is False


def test_main_usa_el_puerto_del_entorno(puerto_vivo, monkeypatch):
    monkeypatch.setenv("PUERTO", str(puerto_vivo))
    assert healthcheck.main() == 0


def test_main_devuelve_un_si_el_puerto_no_responde(puerto_libre, monkeypatch):
    monkeypatch.setenv("PUERTO", str(puerto_libre))
    assert healthcheck.main() == 1
