"""HeinzGomez - Práctica 10: pruebas de las métricas Prometheus del Servicio de Certificados."""
from __future__ import annotations

from app.observabilidad.metricas import Metricas
from app.observabilidad.telemetria import Telemetria, TelemetriaNula


def texto_de(metricas: Metricas) -> str:
    return metricas.exposicion().decode("utf-8")


def test_las_llamadas_rpc_se_cuentan_por_operacion_y_estado():
    m = Metricas()
    m.rpc("certificados.rendir_examen", 120, "ok")
    m.rpc("certificados.rendir_examen", 3000, "error")
    texto = texto_de(m)
    assert 'academix_rpc_requests_total{operation="certificados.rendir_examen",status="ok"} 1.0' in texto
    assert 'academix_rpc_requests_total{operation="certificados.rendir_examen",status="error"} 1.0' in texto
    assert 'academix_rpc_duration_seconds_bucket{le="+Inf",operation="certificados.rendir_examen"} 2.0' in texto


def test_el_estado_del_broker_se_refleja_en_el_gauge():
    m = Metricas()
    assert 'academix_broker_connected 0.0' in texto_de(m)
    assert m.broker_conectado is False
    m.broker(True)
    assert 'academix_broker_connected 1.0' in texto_de(m)
    assert m.broker_conectado is True
    m.broker(False)
    assert 'academix_broker_connected 0.0' in texto_de(m)
    assert m.broker_conectado is False


def test_las_metricas_de_negocio_cuentan_inscripciones_examenes_y_certificados():
    m = Metricas()
    m.inscripcion("aceptada")
    m.inscripcion("descartada")
    m.examen("aprobado")
    m.examen("aprobado")
    m.examen("reprobado")
    m.certificado_emitido()
    texto = texto_de(m)
    assert 'academix_inscripciones_total{estado="aceptada"} 1.0' in texto
    assert 'academix_inscripciones_total{estado="descartada"} 1.0' in texto
    assert 'academix_examenes_total{resultado="aprobado"} 2.0' in texto
    assert 'academix_examenes_total{resultado="reprobado"} 1.0' in texto
    assert 'academix_certificados_emitidos_total 1.0' in texto


def test_incluye_las_metricas_del_proceso_y_el_tipo_de_contenido():
    m = Metricas()
    texto = texto_de(m)
    assert "process_resident_memory_bytes" in texto
    assert "python_gc_collections_total" in texto
    assert m.tipo_contenido.startswith("text/plain")


def test_dos_instancias_no_chocan_en_el_mismo_proceso():
    """Registry propio: crear Metricas() dos veces no lanza Duplicated timeseries."""
    assert "academix_broker_connected" in texto_de(Metricas())
    assert "academix_broker_connected" in texto_de(Metricas())


def test_es_una_telemetria_valida_y_la_nula_sustituye_sin_comportamiento():
    nula = TelemetriaNula()
    assert isinstance(nula, Telemetria)
    nula.rpc("certificados.verificar_certificado", 1.0, "ok")
    nula.broker(True)
    nula.inscripcion("aceptada")
    nula.examen("reprobado")
    nula.certificado_emitido()
    assert isinstance(Metricas(), Telemetria)
