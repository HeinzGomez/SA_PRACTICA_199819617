"""HeinzGomez - Práctica 9: pruebas del dominio (modelos, calificación y firma)."""
from __future__ import annotations

import json

import pytest

from app.domain import (CODIGOS_VALIDOS, ESTADO_ACTIVO, ESTADO_INACTIVO, ESTADOS_EXAMEN, NOTA_MINIMA,
                        Certificado, CertificadosError, Examen, Firmador, Intento, Pregunta, calificar)
from tests.conftest import CORRECTAS, MALAS, PREGUNTAS_EVT, PREGUNTAS_GENERICAS


# ---------- calificación
def test_calificar_es_ponderado_por_punteo():
    assert calificar(PREGUNTAS_EVT, CORRECTAS) == (100, 5, 5)
    assert calificar(PREGUNTAS_EVT, MALAS) == (0, 0, 5)
    genericas = {p.id: sorted(p.correctas)[0] for p in PREGUNTAS_GENERICAS}
    genericas[PREGUNTAS_GENERICAS[0].id] = "x"  # una mal => 80 con punteos iguales
    assert calificar(PREGUNTAS_GENERICAS, genericas) == (80, 4, 5)
    assert calificar([], {}) == (0, 0, 0)


def test_calificar_sin_punteo_utilizable_no_suma_nota():
    """Si todas las preguntas valen 0 no se puede ponderar: se reporta nota 0
    pero igual se cuentan las correctas."""
    p = Pregunta(id="p1", enunciado="?", opciones={"a": "A"}, correctas=frozenset({"a"}), punteo=0)
    assert calificar([p], {"p1": "a"}) == (0, 1, 1)
    q = Pregunta(id="p2", enunciado="?", opciones={"b": "B"}, correctas=frozenset({"b"}), punteo=None)
    assert calificar([q], {"p2": "b"}) == (0, 1, 1)


def test_calificar_no_supera_100():
    """Preguntas con distinto peso: acertar la pesada no puede pasarse de 100."""
    pesada = Pregunta(id="a", enunciado="?", opciones={"1": "x"}, correctas=frozenset({"1"}), punteo=90)
    liviana = Pregunta(id="b", enunciado="?", opciones={"1": "x"}, correctas=frozenset({"1"}), punteo=20)
    assert calificar([pesada, liviana], {"a": "1", "b": "1"}) == (100, 2, 2)


def test_calificar_acepta_una_o_varias_correctas():
    p = Pregunta(id="p1", enunciado="¿Cuáles son protocolos de transporte?",
                 opciones={"a": "HTTP", "b": "gRPC", "c": "SQL", "d": "SSH"},
                 correctas=frozenset({"a", "b"}), punteo=50)
    otra = Pregunta(id="p2", enunciado="?", opciones={"x": "1", "y": "2"},
                    correctas=frozenset({"y"}), punteo=50)
    assert calificar([p, otra], {"p1": "a", "p2": "y"}) == (100, 2, 2)
    assert calificar([p, otra], {"p1": "b", "p2": "x"}) == (50, 1, 2)
    assert calificar([p, otra], {"p1": "c", "p2": "x"}) == (0, 0, 2)


def test_pregunta_es_correcta_exige_un_valor_presente():
    p = Pregunta(id="p", enunciado="?", opciones={"a": "A", "b": "B"},
                 correctas=frozenset({"a", "b"}))
    assert p.es_correcta("a") and p.es_correcta("b")
    assert not p.es_correcta("c")
    assert not p.es_correcta(None) and not p.es_correcta("")


def test_estados_de_examen():
    assert ESTADOS_EXAMEN == (ESTADO_ACTIVO, ESTADO_INACTIVO)
    assert Examen(id=1, id_actividad="e", titulo="t", puntaje_minimo=70, estado="ACTIVO").activo
    assert not Examen(id=2, id_actividad="e", titulo="t", puntaje_minimo=70, estado="INACTIVO").activo
    assert NOTA_MINIMA == 70


def test_error_de_negocio_conserva_codigo_y_mensaje():
    e = CertificadosError("NOT_FOUND", "algo salió mal")
    assert (e.code, e.message) == ("NOT_FOUND", "algo salió mal")
    assert "algo salió mal" in str(e)  # sigue siendo una Exception
    assert "INVALID_ARGUMENT" in CODIGOS_VALIDOS and "INTERNAL" in CODIGOS_VALIDOS


# ---------- firma digital
def test_firmador_detecta_alteraciones():
    f = Firmador("s")
    c = f.firmar(Certificado("C1", "u", "Ana", "e", "Taller", "0970", "SA", 90, "2026-10-01T00:00:00Z"))
    assert len(c.codigo_hash) == 64 and f.verificar(c)
    c.nota = 100
    assert not f.verificar(c)
    otro = Firmador("otra-llave")
    c2 = f.firmar(Certificado("C2", "u", "Ana", "e", "Taller", "0970", "SA", 90, "2026-10-01T00:00:00Z"))
    assert not otro.verificar(c2)
    c2.firma = "no-es-base64!!"
    assert not f.verificar(c2)
    with pytest.raises(ValueError):
        Firmador("")


def test_firma_es_determinista_y_el_hash_identifica_al_payload():
    f = Firmador("semilla")
    cert = Certificado("C3", "u", "Ana", "e", "Taller", "0970", "SA", 95, "2026-10-01T00:00:00Z")
    assert Firmador.hash(cert.payload_canonico()) == Firmador.hash(cert.payload_canonico())
    antes = cert.payload_canonico()
    cert.firma = "x"  # la firma no forma parte del payload: no cambia el hash
    assert cert.payload_canonico() == antes


def test_payload_canonico_es_json_ordenado():
    cert = Certificado("C4", "u", "Ana", "e", "Taller", "0970", "SA", 90, "2026-10-01T00:00:00Z")
    datos = json.loads(cert.payload_canonico())
    assert datos["emisor"] == "USAC-FIUSAC-ACADEMIX"
    assert datos["nota"] == 90 and datos["usuario_id"] == "u"


def test_certificado_y_intento_son_dicts_planos():
    cert = Certificado("C5", "u", "Ana", "e", "T", "0970", "SA", 90, "2026-10-01T00:00:00Z")
    assert cert.to_dict()["id"] == "C5" and cert.to_dict()["firma"] == ""
    intento = Intento(id="I1", usuario_id="u", evento_id="e", nota=80, aprobado=True,
                      correctas=4, total=5, respondido_en="2026-10-01T00:00:00Z")
    assert intento.aprobado and intento.id_examen is None
