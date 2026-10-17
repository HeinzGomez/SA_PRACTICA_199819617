"""HeinzGomez - Práctica 10: servidor HTTP mínimo de sondas del Servicio de Certificados.

Expone `/health` (liveness), `/health/ready` (readiness) y `/metrics` (Prometheus) con
la stdlib: no añade web framework al proceso. El handler recibe sus dependencias por
inyección (closure), sin globales.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Callable, Protocol, runtime_checkable

from .metricas import Metricas

log = logging.getLogger("certificados.observabilidad")

SERVICIO = "certificados-service"
RUTAS_SONDAS = frozenset({"/health", "/health/ready", "/metrics"})


def version() -> str:
    return os.getenv("SERVICE_VERSION", "1.0.0")


@runtime_checkable
class Sondas(Protocol):
    """Verificaciones de readiness: cada dependencia responde por su cuenta (SRP)."""

    def broker_listo(self) -> bool:
        ...

    def base_datos_lista(self) -> bool:
        ...


class SondasDeProceso:
    """Implementación concreta: dos llamadas inyectadas desde `main.py` (DIP)."""

    def __init__(self, broker_listo: Callable[[], bool], base_datos_lista: Callable[[], bool]):
        self._broker_listo = broker_listo
        self._base_datos_lista = base_datos_lista

    def broker_listo(self) -> bool:
        return self._broker_listo()

    def base_datos_lista(self) -> bool:
        return self._base_datos_lista()


def sonda_de_llamada(llamada: Callable[[], object]) -> Callable[[], bool]:
    """Convierte cualquier operación que puede lanzar (ping de Postgres, etc.) en una sonda."""

    def sonda() -> bool:
        try:
            llamada()
        except Exception:  # noqa: BLE001 - la sonda solo informa, no propaga
            return False
        return True

    return sonda


class ManejadorSondas(BaseHTTPRequestHandler):
    """Un GET por ruta conocida; cualquier otra cosa responde 404 en JSON."""

    # inyectadas por ServidorObservabilidad (ver _crear_handler)
    metricas: Metricas
    sondas: Sondas
    inicio: float

    def do_GET(self) -> None:  # noqa: N802 - nombre fijo de http.server
        ruta = self.path.split("?")[0]
        if ruta == "/health":
            self._json(200, {"status": "ok", **self._sello()})
        elif ruta == "/health/ready":
            self._listo()
        elif ruta == "/metrics":
            cuerpo = self.metricas.exposicion()
            self._responder(200, cuerpo, self.metricas.tipo_contenido)
        else:
            self._json(404, {"error": "Ruta no encontrada"})

    def _listo(self) -> None:
        broker_ok = self.sondas.broker_listo()
        base_datos_ok = self.sondas.base_datos_lista()
        listo = broker_ok and base_datos_ok
        cuerpo = {
            "status": "ready" if listo else "not_ready",
            "broker": "ok" if broker_ok else "down",
            "postgres": "ok" if base_datos_ok else "down",
            **self._sello(),
        }
        self._json(200 if listo else 503, cuerpo)

    def _sello(self) -> dict:
        return {
            "servicio": SERVICIO,
            "version": version(),
            "uptime_s": int(time.time() - self.inicio),
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

    def _json(self, estado: int, cuerpo: dict) -> None:
        self._responder(estado, json.dumps(cuerpo).encode("utf-8"),
                        "application/json; charset=utf-8")

    def _responder(self, estado: int, cuerpo: bytes, tipo: str) -> None:
        self.send_response(estado)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, formato: str, *args) -> None:
        """El log de acceso lo emite la aplicación, no la stdlib (solo sondas: 3 rutas)."""
        return None


def _crear_handler(metricas: Metricas, sondas: Sondas) -> type[ManejadorSondas]:
    return type("ManejadorInyectado", (ManejadorSondas,),
                {"metricas": metricas, "sondas": sondas, "inicio": time.time()})


class ServidorObservabilidad:
    """Hilo daemon con el servidor de sondas; `puerto=0` deja que el SO asigne (pruebas)."""

    def __init__(self, puerto: int, metricas: Metricas, sondas: Sondas):
        self._puerto = puerto
        self._metricas = metricas
        self._sondas = sondas
        self._servidor: ThreadingHTTPServer | None = None
        self._hilo: threading.Thread | None = None

    def arrancar(self) -> None:
        self._servidor = ThreadingHTTPServer(("0.0.0.0", self._puerto),
                                             _crear_handler(self._metricas, self._sondas))
        self._hilo = threading.Thread(target=self._servidor.serve_forever,
                                      name="observabilidad", daemon=True)
        self._hilo.start()
        log.info("sondas escuchando en el puerto %s", self.puerto)

    def detener(self) -> None:
        if self._servidor is not None:
            self._servidor.shutdown()
            self._servidor.server_close()
            self._servidor = None
        if self._hilo is not None:
            self._hilo.join(timeout=5)
            self._hilo = None

    @property
    def puerto(self) -> int:
        """Puerto real (útil con puerto efímero 0 en las pruebas)."""
        if self._servidor is None:
            return self._puerto
        return int(self._servidor.server_address[1])

    @property
    def metricas(self) -> Metricas:
        return self._metricas
