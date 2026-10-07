"""HeinzGomez - Práctica 9: pruebas unitarias del Servicio de Certificados (pytest)."""
import json
from datetime import datetime, timezone
from functools import partial
from types import SimpleNamespace

import pytest

from app.broker.consumidor import procesar_mensaje
from app.broker.rpc import _al_recibir
from app.controller import Controlador
from app.domain import MAX_INTENTOS, Certificado, CertificadosError, Firmador, Pregunta, calificar
from app.repository import InMemoryRepository
from app.repository.esquema import preguntas_de_semilla
from app.service import CertificadosService

EVT = "evt-sec-04"
GENERICAS = "evt-k8s-01"
PREGUNTAS_EVT = preguntas_de_semilla(EVT)
PREGUNTAS_GENERICAS = preguntas_de_semilla(GENERICAS)
CORRECTAS = {p.id: sorted(p.correctas)[0] for p in PREGUNTAS_EVT}
MALAS = {p.id: "z" for p in PREGUNTAS_EVT}


@pytest.fixture
def svc():
    reloj = lambda: datetime(2026, 10, 15, 18, 0, tzinfo=timezone.utc)  # noqa: E731
    s = CertificadosService(InMemoryRepository(), Firmador("semilla-de-prueba"), reloj)
    s.registrar_inscripcion({"usuarioId": "u1", "eventoId": EVT, "ticketId": "TKT-1"})
    return s


def emitir(svc, usuario="u1"):
    svc.rendir_examen(usuario, EVT, CORRECTAS)
    return svc.generar_certificado(usuario, EVT, "Heinz Gómez", "Seguridad en APIs", "0785", "AyD 2")


# ---------- dominio
def test_calificar_es_ponderado_por_punteo():
    assert calificar(PREGUNTAS_EVT, CORRECTAS) == (100, 5, 5)
    assert calificar(PREGUNTAS_EVT, {}) == (0, 0, 5)
    genericas = {p.id: sorted(p.correctas)[0] for p in PREGUNTAS_GENERICAS}
    genericas[PREGUNTAS_GENERICAS[0].id] = "x"  # una mal => 80 con punteos iguales
    assert calificar(PREGUNTAS_GENERICAS, genericas) == (80, 4, 5)
    assert calificar([], {}) == (0, 0, 0)


def test_calificar_acepta_una_o_varias_correctas():
    """CDU 3.6: una pregunta puede marcar varias opciones correctas; el estudiante
    responde con una sola y acierta si pertenece al conjunto."""
    p = Pregunta(id="p1", enunciado="¿Cuáles son protocolos de transporte?",
                 opciones={"a": "HTTP", "b": "gRPC", "c": "SQL", "d": "SSH"},
                 correctas=frozenset({"a", "b"}), punteo=50)
    otra = Pregunta(id="p2", enunciado="?", opciones={"x": "1", "y": "2"},
                    correctas=frozenset({"y"}), punteo=50)
    assert calificar([p, otra], {"p1": "a", "p2": "y"}) == (100, 2, 2)
    assert calificar([p, otra], {"p1": "b", "p2": "x"}) == (50, 1, 2)
    assert calificar([p, otra], {"p1": "c", "p2": "x"}) == (0, 0, 2)


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


# ---------- CDU 3.6 examen
def test_examen_requiere_inscripcion(svc):
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen(EVT, "sin-reserva")
    assert e.value.code == "FAILED_PRECONDITION"
    with pytest.raises(CertificadosError) as e:
        svc.obtener_examen("", "")
    assert e.value.code == "INVALID_ARGUMENT"


def test_examen_no_expone_respuestas(svc):
    ex = svc.obtener_examen(EVT, "u1")
    assert ex["nota_minima"] == 70 and len(ex["preguntas"]) == 5
    assert "correcta" not in str(ex)


def test_reprobar_y_limite_de_intentos(svc):
    for _ in range(MAX_INTENTOS):
        assert svc.rendir_examen("u1", EVT, MALAS).aprobado is False
    with pytest.raises(CertificadosError) as e:
        svc.rendir_examen("u1", EVT, CORRECTAS)
    assert e.value.code == "RESOURCE_EXHAUSTED"


def test_no_se_rinde_si_ya_aprobo(svc):
    assert svc.rendir_examen("u1", EVT, CORRECTAS).nota == 100
    with pytest.raises(CertificadosError):
        svc.rendir_examen("u1", EVT, CORRECTAS)


# ---------- CDU 3.7 certificado
def test_generar_requiere_aprobacion(svc):
    with pytest.raises(CertificadosError) as e:
        svc.generar_certificado("u1", EVT, "Heinz", "Titulo", "0785")
    assert e.value.code == "FAILED_PRECONDITION"
    with pytest.raises(CertificadosError) as e:
        svc.generar_certificado("u1", EVT, "", "", "")
    assert e.value.code == "INVALID_ARGUMENT"


def test_generar_es_idempotente_y_firmado(svc):
    c1 = emitir(svc)
    c2 = svc.generar_certificado("u1", EVT, "Heinz Gómez", "Seguridad en APIs", "0785")
    assert c1.id == c2.id and c1.id.startswith("CERT-")
    assert c1.nota == 100 and c1.emitido_en == "2026-10-15T18:00:00Z"
    assert svc.firmador.verificar(c1)


# ---------- CDU 4.x consulta y verificación
def test_listar_con_filtros(svc):
    emitir(svc)
    assert len(svc.listar("u1")) == 1
    assert svc.listar("u1", curso_codigo="0970") == []
    assert len(svc.listar("u1", fecha_desde="2026-10-01", fecha_hasta="2026-10-15")) == 1
    assert svc.listar("u1", fecha_hasta="2026-10-14") == []
    assert svc.listar("u1", fecha_desde="2026-10-16T00:00:00Z") == []
    with pytest.raises(CertificadosError):
        svc.listar("")


def test_verificar_por_id_hash_y_alteracion(svc):
    c = emitir(svc)
    assert svc.verificar(c.id)[0] is True
    assert svc.verificar(c.codigo_hash.upper())[0] is True
    assert svc.verificar(c.id.lower())[0] is True
    valido, msg, _ = svc.verificar("CERT-NOEXISTE")
    assert not valido and "no existe" in msg
    c.nombre_estudiante = "Otra Persona"  # manipulación directa del registro
    valido, msg, _ = svc.verificar(c.id)
    assert not valido and "alterado" in msg
    with pytest.raises(CertificadosError):
        svc.verificar("  ")


# ---------- consumidor RabbitMQ
def test_consumidor_registra_y_descarta(svc):
    assert procesar_mensaje(svc, b'{"usuarioId":"u2","eventoId":"evt-k8s-01","ticketId":"T"}') is True
    assert svc.repo.esta_inscrito("u2", "evt-k8s-01")
    assert procesar_mensaje(svc, b"no-json") is False
    assert procesar_mensaje(svc, b'{"usuarioId":"u2"}') is False


# ---------- contrato RPC de extremo a extremo (cola RPC, envoltorio {ok,datos})
def _llamar(controlador, operacion: str, cuerpo: dict) -> dict:
    respuesta = json.loads(controlador.despachar(operacion, json.dumps(cuerpo).encode()))
    assert respuesta["ok"], respuesta
    return respuesta["datos"]


def _codigo_de(controlador, operacion: str, cuerpo: dict) -> str:
    respuesta = json.loads(controlador.despachar(operacion, json.dumps(cuerpo).encode()))
    assert not respuesta["ok"], respuesta
    return respuesta["error"]["codigo"]


def test_rpc_flujo_completo(svc):
    c = Controlador(svc)
    ex = _llamar(c, "certificados.obtener_examen", {"evento_id": EVT, "usuario_id": "u1"})
    assert len(ex["preguntas"]) == 5 and ex["nota_minima"] == 70
    res = _llamar(c, "certificados.rendir_examen",
                  {"usuario_id": "u1", "evento_id": EVT,
                   "respuestas": [{"pregunta_id": k, "opcion_id": v} for k, v in CORRECTAS.items()]})
    assert res["aprobado"] and res["nota"] == 100
    cert = _llamar(c, "certificados.generar_certificado",
                   {"usuario_id": "u1", "evento_id": EVT, "nombre_estudiante": "Heinz",
                    "evento_titulo": "Seguridad", "curso_codigo": "0785"})
    assert len(cert["codigo_hash"]) == 64
    lista = _llamar(c, "certificados.listar_certificados", {"usuario_id": "u1"})
    assert len(lista["certificados"]) == 1
    ver = _llamar(c, "certificados.verificar_certificado", {"codigo": cert["codigo_hash"]})
    assert ver["valido"] and ver["certificado"]["id"] == cert["id"]
    assert _llamar(c, "certificados.verificar_certificado", {"codigo": "x"})["valido"] is False


def test_rpc_mapea_errores(svc):
    c = Controlador(svc)
    assert _codigo_de(c, "certificados.obtener_examen", {"evento_id": EVT, "usuario_id": "nadie"}) == "FAILED_PRECONDITION"
    assert _codigo_de(c, "certificados.listar_certificados", {}) == "INVALID_ARGUMENT"
    assert _codigo_de(c, "certificados.crear_examen", {"evento_id": EVT, "titulo": "Otro"}) == "FAILED_PRECONDITION"
    assert _codigo_de(c, "certificados.agregar_pregunta", {"id_examen": 9999, "enunciado": "?"}) == "NOT_FOUND"
    with pytest.raises(CertificadosError):
        c.despachar("certificados.inexistente", b"{}")


# ---------- adaptador pika: la firma exacta con la que el broker entrega los mensajes
class _CanalFalso:
    def __init__(self):
        self.ack: list = []
        self.nack: list = []
        self.publicados: list = []

    def basic_ack(self, tag):  # noqa: D102
        self.ack.append(tag)

    def basic_nack(self, tag, requeue=False):  # noqa: D102
        self.nack.append((tag, requeue))

    def basic_publish(self, **kw):  # noqa: D102
        self.publicados.append(kw)
        return None  # BlockingChannel.basic_publish no devuelve nada


def _callback(c):
    return partial(_al_recibir, c)


def test_callback_de_consume_acepta_los_4_argumentos_de_pika(svc):
    """Regresión: pika 1.x invoca el callback con (channel, method, properties, body).
    Con un lambda de 3 argumentos el servicio reventaba al consumir el primer mensaje,
    nunca respondía en replyTo y el API Gateway devolvía 503 UNAVAILABLE."""
    emitir(svc)
    canal = _CanalFalso()
    _callback(Controlador(svc))(
        canal,
        SimpleNamespace(routing_key="certificados.listar_certificados", delivery_tag=1),
        SimpleNamespace(reply_to="reply.q", correlation_id="c-1"),
        json.dumps({"usuario_id": "u1"}).encode(),
    )
    assert canal.ack == [1] and not canal.nack
    assert canal.publicados[0]["routing_key"] == "reply.q"
    assert canal.publicados[0]["properties"].correlation_id == "c-1"
    respuesta = json.loads(canal.publicados[0]["body"])
    assert respuesta["ok"] and len(respuesta["datos"]["certificados"]) == 1


def test_callback_sin_reply_to_va_a_la_dlq(svc):
    canal = _CanalFalso()
    _callback(Controlador(svc))(
        canal,
        SimpleNamespace(routing_key="certificados.verificar_certificado", delivery_tag=2),
        SimpleNamespace(reply_to=None, correlation_id=None),
        json.dumps({"codigo": "x"}).encode(),
    )
    assert canal.nack == [(2, False)] and not canal.ack


def test_consulta_de_examen_para_administrador(svc):
    """El administrador ve el examen (y sus respuestas) sin estar inscrito; si la
    actividad no tiene examen el broker responde NOT_FOUND -> 404 en el gateway."""
    c = Controlador(svc)
    ex = _llamar(c, "certificados.obtener_examen_admin", {"evento_id": EVT})
    assert ex["id_examen"] > 0 and len(ex["preguntas"]) == 5
    assert any(o["es_correcta"] for p in ex["preguntas"] for o in p["opciones"])
    assert _codigo_de(c, "certificados.obtener_examen_admin", {"evento_id": "evt-sin-examen"}) == "NOT_FOUND"


def test_agregar_pregunta_admite_varias_correctas(svc):
    c = Controlador(svc)
    nuevo = _llamar(c, "certificados.crear_examen",
                    {"evento_id": "evt-multi-01", "titulo": "Examen múltiple"})
    pregunta = _llamar(c, "certificados.agregar_pregunta",
                       {"id_examen": nuevo["id_examen"], "enunciado": "¿Qué son APIs?",
                        "opciones": [{"texto": "Interfaces", "es_correcta": True},
                                     {"texto": "Contratos", "es_correcta": True},
                                     {"texto": "Bases de datos", "es_correcta": False},
                                     {"texto": "Lámparas", "es_correcta": False}]})
    assert [o["texto"] for o in pregunta["opciones"] if o["es_correcta"]] == ["Interfaces", "Contratos"]
    # y sin ninguna correcta el broker la rechaza
    assert _codigo_de(c, "certificados.agregar_pregunta",
                      {"id_examen": nuevo["id_examen"], "enunciado": "Sin correcta",
                       "opciones": [{"texto": "a"}, {"texto": "b"}]}) == "INVALID_ARGUMENT"


def test_administra_examen_y_preguntas(svc):
    c = Controlador(svc)
    nuevo = _llamar(c, "certificados.crear_examen",
                    {"evento_id": "evt-nuevo-99", "titulo": "Examen de prueba", "puntaje_minimo": 60})
    assert nuevo["id_examen"] > 0 and nuevo["estado"] == "ACTIVO"
    pregunta = _llamar(c, "certificados.agregar_pregunta",
                       {"id_examen": nuevo["id_examen"], "enunciado": "¿Dos más dos?",
                        "opciones": [{"texto": "4", "es_correcta": True},
                                     {"texto": "5", "es_correcta": False}]})
    assert len(pregunta["opciones"]) == 2 and any(o["es_correcta"] for o in pregunta["opciones"])
    # la pregunta quedó en el examen y se entrega en el siguiente ObtenerExamen
    svc.registrar_inscripcion({"usuarioId": "u3", "eventoId": "evt-nuevo-99", "ticketId": "T-99"})
    ex = _llamar(c, "certificados.obtener_examen", {"evento_id": "evt-nuevo-99", "usuario_id": "u3"})
    assert len(ex["preguntas"]) == 1
    assert _codigo_de(c, "certificados.agregar_pregunta",
                      {"id_examen": nuevo["id_examen"], "enunciado": "x",
                       "opciones": [{"texto": "a"}]}) == "INVALID_ARGUMENT"
