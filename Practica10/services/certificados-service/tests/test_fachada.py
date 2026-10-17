"""HeinzGomez - Práctica 9: pruebas de la fachada del servicio y de las utilidades de fecha."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.domain import CertificadosError, Firmador
from app.repository import InMemoryRepository
from app.service import CertificadosService
from app.service.reloj import ahora, iso, parse
from tests.conftest import CORRECTAS, EVT


# ---------- utilidades de fecha
def test_ahora_es_utc_con_zona_horaria():
    momento = ahora()
    assert momento.tzinfo is not None
    assert momento.utcoffset() == timedelta(0)


def test_iso_usa_el_formato_del_contrato():
    assert iso(datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc)) == "2026-10-15T18:00:00Z"
    assert iso(datetime(2026, 10, 15, 18, 0, 0, 123456, tzinfo=timezone.utc)) == "2026-10-15T18:00:00Z"
    # otra zona horaria se convierte a UTC antes de escribir la Z
    leones = datetime(2026, 10, 15, 12, 0, tzinfo=timezone(timedelta(hours=-6)))
    assert iso(leones) == "2026-10-15T18:00:00Z"


def test_parse_acepta_z_y_sin_zona():
    assert parse("2026-10-15T18:00:00Z") == datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc)
    sin_zona = parse("2026-10-15")
    assert sin_zona.tzinfo is timezone.utc
    assert iso(parse("2026-10-01T00:00:00Z")) == "2026-10-01T00:00:00Z"


# ---------- fachada
def test_fachada_delega_en_los_casos_de_uso(svc):
    assert isinstance(svc.repo, InMemoryRepository)
    assert isinstance(svc.firmador, Firmador)
    assert svc.inscripciones and svc.examen and svc.certificado

    svc.registrar_inscripcion({"usuarioId": "u9", "eventoId": EVT, "ticketId": "T9"})
    assert svc.repo.esta_inscrito("u9", EVT)

    assert svc.obtener_examen(EVT, "u9")["nota_minima"] == 70
    assert svc.rendir_examen("u9", EVT, CORRECTAS).aprobado is True
    assert svc.generar_certificado("u9", EVT, "Ana", "T", "0785").id.startswith("CERT-")
    assert len(svc.listar("u9")) == 1
    assert svc.verificar(svc.listar("u9")[0].id)[0] is True


def test_fachada_sin_reloj_inyectado_usa_la_hora_real():
    s = CertificadosService(InMemoryRepository(), Firmador("semilla"))
    assert s.reloj is ahora
    s.registrar_inscripcion({"usuarioId": "u1", "eventoId": EVT, "ticketId": "T"})
    s.rendir_examen("u1", EVT, CORRECTAS)
    cert = s.generar_certificado("u1", EVT, "Ana", "T", "0785")
    assert cert.emitido_en.endswith("Z")
    assert parse(cert.emitido_en) <= ahora()


def test_fachada_valida_inscripcion_a_traves_de_toda_la_cadena(svc):
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen(EVT, "nadie")
    assert e.value.code == "FAILED_PRECONDITION"
