"""HeinzGomez - Práctica 9: pruebas del adaptador de entrada (cola RPC -> casos de uso).

Contrato: {"ok":true,"datos":...} o {"ok":false,"error":{"codigo","mensaje"}}.
"""
from __future__ import annotations

import json

import pytest

from app.controller import Controlador
from app.domain import CertificadosError
from tests.conftest import CORRECTAS, EVT, EVT_SIN_EXAMEN


def test_la_tabla_de_operaciones_es_el_contrato_del_broker(controlador):
    assert controlador.operaciones == [
        "certificados.obtener_examen",
        "certificados.rendir_examen",
        "certificados.generar_certificado",
        "certificados.listar_certificados",
        "certificados.verificar_certificado",
        "certificados.obtener_examen_admin",
        "certificados.crear_examen",
        "certificados.agregar_pregunta",
    ]
    # copia defensiva: no se puede mutar la tabla desde afuera
    controlador.operaciones.append("hack")
    assert len(controlador.operaciones) == 8


def test_operacion_desconocida_no_responde_sino_que_lanza(controlador):
    """El consumidor debe NACKear (DLQ) cuando la operación no existe: nunca
    inventar una respuesta para un routing key que no existe."""
    with pytest.raises(CertificadosError) as e:
        controlador.despachar("certificados.inexistente", b"{}")
    assert e.value.code == "NOT_FOUND"


def test_cuerpo_que_no_es_json(controlador):
    respuesta = json.loads(controlador.despachar("certificados.listar_certificados", b"no-json"))
    assert respuesta == {"ok": False, "error": {"codigo": "INVALID_ARGUMENT",
                                                "mensaje": "El cuerpo de la petición no es JSON válido"}}


def test_cuerpo_que_no_es_un_objeto(controlador):
    respuesta = json.loads(controlador.despachar("certificados.listar_certificados", b"[1,2]"))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"
    assert "objeto JSON" in respuesta["error"]["mensaje"]

    respuesta = json.loads(controlador.despachar("certificados.listar_certificados", b'"texto"'))
    assert not respuesta["ok"]


def test_cuerpo_vacio_se_trata_como_objeto_vacio(controlador):
    respuesta = json.loads(controlador.despachar("certificados.listar_certificados", b""))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"


def test_error_interno_no_filtra_el_detalle():
    class _SvcRoto:
        def obtener_examen(self, *args):
            raise RuntimeError("fallo la conexion con la base: clave=abc123")

    respuesta = json.loads(Controlador(_SvcRoto()).despachar("certificados.obtener_examen", b"{}"))
    assert respuesta["ok"] is False
    assert respuesta["error"] == {"codigo": "INTERNAL", "mensaje": "Error interno"}
    assert "abc123" not in json.dumps(respuesta)


def test_error_de_negocio_si_llega_al_envoltorio(controlador):
    respuesta = json.loads(controlador.despachar("certificados.obtener_examen",
                                                 json.dumps({"evento_id": EVT,
                                                             "usuario_id": "nadie"}).encode()))
    assert respuesta["ok"] is False
    assert respuesta["error"]["codigo"] == "FAILED_PRECONDITION"
    assert "reserva CONFIRMADA" in respuesta["error"]["mensaje"]


def test_flujo_completo_por_la_cola(llamar):
    ex = llamar("certificados.obtener_examen", {"evento_id": EVT, "usuario_id": "u1"})
    assert len(ex["preguntas"]) == 5 and ex["nota_minima"] == 70

    res = llamar("certificados.rendir_examen",
                 {"usuario_id": "u1", "evento_id": EVT,
                  "respuestas": [{"pregunta_id": k, "opcion_id": v} for k, v in CORRECTAS.items()]})
    assert res["aprobado"] and res["nota"] == 100 and res["correctas"] == 5

    cert = llamar("certificados.generar_certificado",
                  {"usuario_id": "u1", "evento_id": EVT, "nombre_estudiante": "Heinz",
                   "evento_titulo": "Seguridad", "curso_codigo": "0785"})
    assert len(cert["codigo_hash"]) == 64 and cert["nombre_estudiante"] == "Heinz"

    lista = llamar("certificados.listar_certificados", {"usuario_id": "u1"})
    assert len(lista["certificados"]) == 1

    ver = llamar("certificados.verificar_certificado", {"codigo": cert["codigo_hash"]})
    assert ver["valido"] and ver["certificado"]["id"] == cert["id"]
    assert llamar("certificados.verificar_certificado", {"codigo": "x"})["valido"] is False


def test_mapeo_de_errores_a_codigos(codigo_de):
    assert codigo_de("certificados.obtener_examen",
                     {"evento_id": EVT, "usuario_id": "nadie"}) == "FAILED_PRECONDITION"
    assert codigo_de("certificados.listar_certificados", {}) == "INVALID_ARGUMENT"
    assert codigo_de("certificados.crear_examen",
                     {"evento_id": EVT, "titulo": "Otro"}) == "FAILED_PRECONDITION"
    assert codigo_de("certificados.agregar_pregunta",
                     {"id_examen": 9999, "enunciado": "?"}) == "NOT_FOUND"
    assert codigo_de("certificados.obtener_examen_admin",
                     {"evento_id": EVT_SIN_EXAMEN}) == "NOT_FOUND"


def test_respuestas_del_examen_debe_ser_lista(controlador):
    cuerpo = json.dumps({"usuario_id": "u1", "evento_id": EVT, "respuestas": "todo bien"}).encode()
    respuesta = json.loads(controlador.despachar("certificados.rendir_examen", cuerpo))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"
    assert respuesta["error"]["mensaje"] == "respuestas debe ser una lista"


def test_opciones_debe_ser_lista(controlador):
    cuerpo = json.dumps({"id_examen": 1, "enunciado": "?", "opciones": "a,b"}).encode()
    respuesta = json.loads(controlador.despachar("certificados.agregar_pregunta", cuerpo))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"
    assert respuesta["error"]["mensaje"] == "opciones debe ser una lista"


def test_ids_ausentes_se_vuelven_cadenas_vacias(controlador):
    """`_textos` normaliza claves ausentes o null para que el servicio valide el error."""
    respuesta = json.loads(controlador.despachar("certificados.listar_certificados", b"{}"))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"

    respuesta = json.loads(controlador.despachar("certificados.verificar_certificado",
                                                 json.dumps({"codigo": None}).encode()))
    assert not respuesta["ok"] and respuesta["error"]["codigo"] == "INVALID_ARGUMENT"


def test_verificar_no_devuelve_certificado_invalido(controlador, emitir):
    cert = emitir()
    cuerpo = json.dumps({"codigo": cert.id}).encode()
    ok = json.loads(controlador.despachar("certificados.verificar_certificado", cuerpo))
    assert ok["datos"]["valido"] is True and ok["datos"]["certificado"] is not None

    cert.nota = 1  # alterado
    malo = json.loads(controlador.despachar("certificados.verificar_certificado", cuerpo))
    assert malo["datos"]["valido"] is False and malo["datos"]["certificado"] is None
