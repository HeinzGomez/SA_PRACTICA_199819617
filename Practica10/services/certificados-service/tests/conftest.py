"""HeinzGomez - Práctica 9: fixtures compartidos de la suite de Certificados.

Un solo repositorio en memoria + un reloj fijo por prueba: nada de infraestructura,
sin hilos ni procesos, para que la suite corra en un solo proceso y con poca RAM.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from app.controller import Controlador
from app.domain import Firmador
from app.repository import InMemoryRepository
from app.repository.esquema import preguntas_de_semilla
from app.service import CertificadosService

EVT = "evt-sec-04"          # sembrado con el banco de Seguridad
EVT_GENERICO = "evt-k8s-01"  # sembrado con el banco genérico
EVT_SIN_EXAMEN = "evt-sin-examen"

PREGUNTAS_EVT = preguntas_de_semilla(EVT)
PREGUNTAS_GENERICAS = preguntas_de_semilla(EVT_GENERICO)
CORRECTAS = {p.id: sorted(p.correctas)[0] for p in PREGUNTAS_EVT}
MALAS = {p.id: "z" for p in PREGUNTAS_EVT}

RELOJ_FIJO = datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc)


def reloj_fijo() -> datetime:
    return RELOJ_FIJO


@pytest.fixture
def svc() -> CertificadosService:
    """Servicio con repositorio en memoria, firma de prueba y reloj congelado."""
    s = CertificadosService(InMemoryRepository(), Firmador("semilla-de-prueba"), reloj_fijo)
    s.registrar_inscripcion({"usuarioId": "u1", "eventoId": EVT, "ticketId": "TKT-1"})
    return s


@pytest.fixture
def controlador(svc) -> Controlador:
    return Controlador(svc)


@pytest.fixture
def llamar(controlador):
    """Llama a una operación del contrato RPC y devuelve `datos` si todo salió bien."""

    def _llamar(operacion: str, cuerpo: dict) -> dict:
        respuesta = json.loads(controlador.despachar(operacion, json.dumps(cuerpo).encode()))
        assert respuesta["ok"], respuesta
        return respuesta["datos"]

    return _llamar


@pytest.fixture
def codigo_de(controlador):
    """Llama a una operación y devuelve el código de error del envoltorio."""

    def _codigo_de(operacion: str, cuerpo: dict) -> str:
        respuesta = json.loads(controlador.despachar(operacion, json.dumps(cuerpo).encode()))
        assert not respuesta["ok"], respuesta
        return respuesta["error"]["codigo"]

    return _codigo_de


@pytest.fixture
def emitir(svc):
    """Aprueba el examen y emite el diploma de u1 en EVT."""

    def _emitir(usuario: str = "u1"):
        svc.rendir_examen(usuario, EVT, CORRECTAS)
        return svc.generar_certificado(usuario, EVT, "Heinz Gómez", "Seguridad en APIs",
                                       "0785", "AyD 2")

    return _emitir
