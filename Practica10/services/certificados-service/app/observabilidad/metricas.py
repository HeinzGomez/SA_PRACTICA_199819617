"""HeinzGomez - Práctica 10: métricas Prometheus del Servicio de Certificados.

Usa un `CollectorRegistry` propio (no el global): dos instancias en la misma suite
de pruebas no chocan con "Duplicated timeseries". La identidad del servicio en
Prometheus la da el `job` del target (`certificados-service`).
"""
from __future__ import annotations

from prometheus_client import (CONTENT_TYPE_LATEST, GCCollector, CollectorRegistry, Counter,
                               Gauge, Histogram, PlatformCollector, ProcessCollector,
                               generate_latest)

from .telemetria import Telemetria

# Mismos buckets que el API Gateway: permiten comparar latencias en un solo tablero.
BUCKETS_SEGUNDOS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]


class Metricas:
    """Registro Prometheus del proceso; además implementa `Telemetria`."""

    def __init__(self) -> None:
        self._registro = CollectorRegistry()
        self._rpc_total = Counter(
            "academix_rpc_requests_total",
            "Llamadas RPC atendidas por el servicio",
            ["operation", "status"],
            registry=self._registro,
        )
        self._rpc_duracion = Histogram(
            "academix_rpc_duration_seconds",
            "Duracion de las operaciones RPC en segundos",
            ["operation"],
            buckets=BUCKETS_SEGUNDOS,
            registry=self._registro,
        )
        self._broker = Gauge(
            "academix_broker_connected",
            "Conexion con RabbitMQ (1 conectado, 0 desconectado)",
            registry=self._registro,
        )
        self._inscripciones = Counter(
            "academix_inscripciones_total",
            "Eventos de reserva.confirmada procesados",
            ["estado"],
            registry=self._registro,
        )
        self._examenes = Counter(
            "academix_examenes_total",
            "Examenes de certificacion rendidos",
            ["resultado"],
            registry=self._registro,
        )
        self._certificados = Counter(
            "academix_certificados_emitidos_total",
            "Certificados emitidos por el servicio",
            registry=self._registro,
        )
        # Colectores del proceso sobre el registro propio (el global no nos sirve aquí).
        ProcessCollector(registry=self._registro)
        GCCollector(registry=self._registro)
        PlatformCollector(registry=self._registro)
        self._broker_conectado = False
        self._broker.set(0)

    # --- estado observado (lo usan las sondas de readiness)
    @property
    def broker_conectado(self) -> bool:
        """Último estado reportado por los consumidores al conectar o reconectar."""
        return self._broker_conectado

    # --- Telemetria
    def rpc(self, operacion: str, ms: float, estado: str) -> None:
        self._rpc_total.labels(operation=operacion, status=estado).inc()
        self._rpc_duracion.labels(operation=operacion).observe(ms / 1000)

    def broker(self, conectado: bool) -> None:
        self._broker_conectado = conectado
        self._broker.set(1 if conectado else 0)

    def inscripcion(self, estado: str) -> None:
        self._inscripciones.labels(estado=estado).inc()

    def examen(self, resultado: str) -> None:
        self._examenes.labels(resultado=resultado).inc()

    def certificado_emitido(self) -> None:
        self._certificados.inc()

    # --- exposición
    @property
    def tipo_contenido(self) -> str:
        return CONTENT_TYPE_LATEST

    def exposicion(self) -> bytes:
        return generate_latest(self._registro)
