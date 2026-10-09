"""HeinzGomez - Práctica 9: pruebas de los casos de uso de certificados
(CDU 3.7 emisión, 4.1/4.2 consulta, 4.3/4.4 verificación)."""
from __future__ import annotations

import pytest

from app.domain import CertificadosError
from tests.conftest import CORRECTAS, EVT


# ---------- CDU 3.7 emisión
def test_generar_requiere_aprobacion(svc):
    with pytest.raises(CertificadosError) as e:
        svc.generar_certificado("u1", EVT, "Heinz", "Titulo", "0785")
    assert e.value.code == "FAILED_PRECONDITION"
    assert "examen" in e.value.message


def test_generar_valida_los_datos_del_estudiante(svc):
    with pytest.raises(CertificadosError) as e:
        svc.generar_certificado("u1", EVT, "", "", "")
    assert e.value.code == "INVALID_ARGUMENT"
    with pytest.raises(CertificadosError) as e:
        svc.generar_certificado("u1", EVT, "Heinz", "", "0785")
    assert e.value.code == "INVALID_ARGUMENT"


def test_generar_es_idempotente_y_firmado(svc, emitir):
    c1 = emitir()
    c2 = svc.generar_certificado("u1", EVT, "Heinz Gómez", "Seguridad en APIs", "0785")
    assert c1.id == c2.id and c1.id.startswith("CERT-")
    assert c1.nota == 100 and c1.emitido_en == "2026-10-15T18:00:00Z"
    assert c1.nombre_estudiante == "Heinz Gómez" and c1.curso_codigo == "0785"
    assert svc.firmador.verificar(c1)
    assert len(c1.codigo_hash) == 64 and len(c1.firma) > 0


def test_generar_toma_la_mejor_nota_de_los_intentos_aprobados(svc):
    """Primer intento con 0, segundo perfecto: el diploma se queda con la nota máxima."""
    assert svc.rendir_examen("u1", EVT, {}).nota == 0
    assert svc.rendir_examen("u1", EVT, CORRECTAS).nota == 100
    cert = svc.generar_certificado("u1", EVT, "Heinz", "Seguridad", "0785")
    assert cert.nota == 100


# ---------- CDU 4.1 / 4.2 consulta
def test_listar_con_filtros(svc, emitir):
    emitir()
    assert len(svc.listar("u1")) == 1
    assert svc.listar("u1", curso_codigo="0970") == []
    assert len(svc.listar("u1", fecha_desde="2026-10-01", fecha_hasta="2026-10-15")) == 1
    assert svc.listar("u1", fecha_hasta="2026-10-14") == []
    assert svc.listar("u1", fecha_desde="2026-10-16T00:00:00Z") == []
    with pytest.raises(CertificadosError) as e:
        svc.listar("")
    assert e.value.code == "INVALID_ARGUMENT"


def test_listar_por_curso(svc, emitir):
    emitir()
    assert [c.curso_codigo for c in svc.listar("u1", curso_codigo="0785")] == ["0785"]
    assert svc.listar("u1", curso_codigo="1111") == []


def test_listar_sin_certificados_devuelve_vacio(svc):
    assert svc.listar("u1") == []
    assert svc.listar("nadie") == []


# ---------- CDU 4.3 / 4.4 verificación
def test_verificar_por_id_hash_y_alteracion(svc, emitir):
    c = emitir()
    assert svc.verificar(c.id)[0] is True
    assert svc.verificar(c.codigo_hash.upper())[0] is True
    assert svc.verificar(c.id.lower())[0] is True
    valido, msg, _ = svc.verificar("CERT-NOEXISTE")
    assert not valido and "no existe" in msg
    c.nombre_estudiante = "Otra Persona"  # manipulación directa del registro
    valido, msg, _ = svc.verificar(c.id)
    assert not valido and "alterado" in msg
    with pytest.raises(CertificadosError) as e:
        svc.verificar("  ")
    assert e.value.code == "INVALID_ARGUMENT"


def test_verificar_devuelve_el_certificado_solo_si_es_valido(svc, emitir):
    c = emitir()
    valido, _msg, cert = svc.verificar(c.id)
    assert valido and cert is not None and cert.id == c.id
    c.nota = 1
    valido, _msg, cert = svc.verificar(c.id)
    assert not valido and cert is not None  # se devuelve el alterado para poder auditarlo
    _v, _m, ninguno = svc.verificar("CERT-INEXISTENTE")
    assert ninguno is None
