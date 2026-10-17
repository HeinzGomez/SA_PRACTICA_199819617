"""HeinzGomez - Práctica 10: pruebas del servidor de sondas (health, readiness y metrics).

Un solo servidor por prueba, en puerto efímero y cerrado en el fixture: la suite no
deja hilos ni sockets abiertos y sigue corriendo en un proceso con poca RAM.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from types import SimpleNamespace

import pytest

from app.observabilidad.metricas import Metricas
from app.observabilidad.servidor import ServidorObservabilidad, SondasDeProceso, sonda_de_llamada


def _arrancar(broker: bool = True, base_datos: bool = True) -> ServidorObservabilidad:
    servidor = ServidorObservabilidad(0, Metricas(),
                                      SondasDeProceso(lambda: broker, lambda: base_datos))
    servidor.arrancar()
    return servidor


@pytest.fixture
def observatorio():
    servidor = _arrancar()
    try:
        yield SimpleNamespace(servidor=servidor, metricas=servidor.metricas)
    finally:
        servidor.detener()


def _get(puerto: int, ruta: str):
    with urllib.request.urlopen(f"http://127.0.0.1:{puerto}{ruta}", timeout=3) as respuesta:
        return respuesta.status, respuesta.read(), respuesta.headers.get("Content-Type", "")


def _get_y_falla(puerto: int, ruta: str):
    try:
        _get(puerto, ruta)
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    raise AssertionError(f"{ruta} debía responder con error HTTP")


def test_health_es_liveness_y_no_consulta_dependencias(observatorio):
    estado, cuerpo, tipo = _get(observatorio.servidor.puerto, "/health")
    documento = json.loads(cuerpo)
    assert estado == 200
    assert documento["status"] == "ok"
    assert documento["servicio"] == "certificados-service"
    assert isinstance(documento["uptime_s"], int)
    assert documento["timestamp"].endswith("Z")
    assert "application/json" in tipo


def test_health_responde_200_aunque_las_dependencias_caean():
    """Liveness: el proceso sigue vivo aunque RabbitMQ o Postgres no estén."""
    servidor = _arrancar(broker=False, base_datos=False)
    try:
        estado, cuerpo, _ = _get(servidor.puerto, "/health")
        assert estado == 200
        assert json.loads(cuerpo)["status"] == "ok"
    finally:
        servidor.detener()


def test_ready_responde_200_cuando_broker_y_postgres_estan_arriba(observatorio):
    estado, cuerpo, _ = _get(observatorio.servidor.puerto, "/health/ready")
    documento = json.loads(cuerpo)
    assert estado == 200
    assert documento["status"] == "ready"
    assert documento["broker"] == "ok"
    assert documento["postgres"] == "ok"
    assert documento["servicio"] == "certificados-service"


@pytest.mark.parametrize("broker,base_datos,esperado", [
    (False, True, ("down", "ok")),
    (True, False, ("ok", "down")),
    (False, False, ("down", "down")),
])
def test_ready_responde_503_si_alguna_dependencia_falla(broker, base_datos, esperado):
    servidor = _arrancar(broker=broker, base_datos=base_datos)
    try:
        estado, cuerpo = _get_y_falla(servidor.puerto, "/health/ready")
        documento = json.loads(cuerpo)
        assert estado == 503
        assert documento["status"] == "not_ready"
        assert (documento["broker"], documento["postgres"]) == esperado
    finally:
        servidor.detener()


def test_metrics_expone_las_metricas_del_servicio(observatorio):
    observatorio.metricas.rpc("certificados.verificar_certificado", 5, "ok")
    estado, cuerpo, tipo = _get(observatorio.servidor.puerto, "/metrics")
    texto = cuerpo.decode("utf-8")
    assert estado == 200
    assert 'academix_rpc_requests_total{operation="certificados.verificar_certificado",status="ok"}' in texto
    assert "academix_broker_connected" in texto
    assert "process_resident_memory_bytes" in texto
    assert tipo.startswith("text/plain")


def test_rutas_desconocidas_devuelven_404_en_json(observatorio):
    estado, cuerpo = _get_y_falla(observatorio.servidor.puerto, "/inexistente")
    assert estado == 404
    assert json.loads(cuerpo) == {"error": "Ruta no encontrada"}


def test_detener_libera_el_puerto():
    servidor = _arrancar()
    puerto = servidor.puerto
    servidor.detener()
    with pytest.raises(urllib.error.URLError):
        _get(puerto, "/health")
    assert servidor.puerto == 0  # sin servidor devuelve el puerto pedido


def test_detener_es_idempotente():
    """El apagado puede llegar dos veces (SIGTERM + timeout del orquestador)."""
    servidor = _arrancar()
    servidor.detener()
    servidor.detener()


def test_sonda_de_llamada_convierte_una_excepcion_en_false():
    sonda_ok = sonda_de_llamada(lambda: "SELECT 1")
    sonda_rota = sonda_de_llamada(lambda: (_ for _ in ()).throw(ConnectionError("base caída")))
    assert sonda_ok() is True
    assert sonda_rota() is False


def test_las_sondas_inyectadas_delegan_en_los_callables():
    llamadas = []
    sondas = SondasDeProceso(lambda: llamadas.append("b") or True,
                             lambda: llamadas.append("d") or False)
    assert sondas.broker_listo() is True
    assert sondas.base_datos_lista() is False
    assert llamadas == ["b", "d"]
