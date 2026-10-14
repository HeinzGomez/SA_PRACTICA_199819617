"""HeinzGomez - Práctica 10: logging estructurado (JSON por stdout) con la stdlib.

Una línea JSON por evento, lista para que la ingiera Docker/K3s sin colector extra.
Solo stdlib: sin structlog ni configuración por archivo (SRP: formatear y configurar).
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import IO, Optional

SERVICIO = "certificados-service"
NIVEL_POR_DEFECTO = "info"


def version() -> str:
    return os.getenv("SERVICE_VERSION", "1.0.0")


class FormateadorJSON(logging.Formatter):
    """Convierte cada LogRecord en un objeto JSON de una sola línea."""

    def __init__(self, servicio: str = SERVICIO, version_servicio: Optional[str] = None):
        super().__init__()
        self.servicio = servicio
        self.version_servicio = version_servicio if version_servicio is not None else version()

    def format(self, record: logging.LogRecord) -> str:
        documento = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc)
            .isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            "nivel": record.levelname,
            "logger": record.name,
            "mensaje": record.getMessage(),
            "servicio": self.servicio,
            "version": self.version_servicio,
        }
        if record.exc_info:
            documento["error"] = self.formatException(record.exc_info)
        return json.dumps(documento, ensure_ascii=False)


def configurar_logging(nivel: Optional[str] = None, destino: Optional[IO[str]] = None) -> logging.Logger:
    """Configura el logger raíz con el formateador JSON y lo devuelve (composition root).

    `destino` solo lo usan las pruebas: en producción escribe por stdout.
    """
    raiz = logging.getLogger()
    raiz.handlers.clear()
    handler = logging.StreamHandler(destino if destino is not None else sys.stdout)
    handler.setFormatter(FormateadorJSON())
    raiz.addHandler(handler)
    raiz.setLevel((nivel or os.getenv("LOG_LEVEL", NIVEL_POR_DEFECTO)).upper())
    return raiz
