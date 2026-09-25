"""HeinzGomez - Práctica 7: pruebas unitarias del Servicio de Certificados (pytest)."""
from concurrent import futures
from datetime import datetime, timezone

import grpc
import pytest

from app.consumer import procesar_mensaje
from app.domain import (MAX_INTENTOS, Certificado, CertificadosError, Firmador, calificar,
                        preguntas_para)
from app.gen import certificados_pb2 as pb
from app.gen import certificados_pb2_grpc as pb_grpc
from app.grpc_server import registrar
from app.repository import InMemoryRepository
from app.service import CertificadosService

EVT = "evt-sec-04"
CORRECTAS = {p.id: p.correcta for p in preguntas_para(EVT)}
MALAS = {p.id: "z" for p in preguntas_para(EVT)}


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
def test_calificar_banco_especifico_y_generico():
    assert calificar(EVT, CORRECTAS) == (100, 5, 5)
    assert calificar(EVT, {}) == (0, 0, 5)
    genericas = {p.id: p.correcta for p in preguntas_para("otro")}
    genericas["g1"] = "x"
    assert calificar("otro", genericas) == (80, 4, 5)


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


# ---------- contrato gRPC de extremo a extremo (servidor en proceso)
@pytest.fixture
def stub(svc):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    registrar(server, svc)
    port = server.add_insecure_port("127.0.0.1:0")
    server.start()
    canal = grpc.insecure_channel(f"127.0.0.1:{port}")
    yield pb_grpc.CertificadosServiceStub(canal)
    canal.close()
    server.stop(None)


def test_grpc_flujo_completo(stub):
    ex = stub.ObtenerExamen(pb.ExamenRequest(evento_id=EVT, usuario_id="u1"))
    assert len(ex.preguntas) == 5 and ex.nota_minima == 70
    res = stub.RendirExamen(pb.RespuestasExamen(usuario_id="u1", evento_id=EVT, respuestas=[
        pb.Respuesta(pregunta_id=k, opcion_id=v) for k, v in CORRECTAS.items()]))
    assert res.aprobado and res.nota == 100
    cert = stub.GenerarCertificado(pb.SolicitudCertificado(usuario_id="u1", evento_id=EVT, nombre_estudiante="Heinz",
                                                           evento_titulo="Seguridad", curso_codigo="0785"))
    assert len(cert.codigo_hash) == 64
    assert len(stub.ListarCertificados(pb.FiltroCertificados(usuario_id="u1")).certificados) == 1
    ver = stub.VerificarCertificado(pb.VerificarRequest(codigo=cert.codigo_hash))
    assert ver.valido and ver.certificado.id == cert.id
    assert stub.VerificarCertificado(pb.VerificarRequest(codigo="x")).valido is False


def test_grpc_mapea_errores(stub):
    with pytest.raises(grpc.RpcError) as e:
        stub.ObtenerExamen(pb.ExamenRequest(evento_id=EVT, usuario_id="nadie"))
    assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
    with pytest.raises(grpc.RpcError) as e:
        stub.ListarCertificados(pb.FiltroCertificados())
    assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
