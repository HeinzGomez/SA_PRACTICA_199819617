"""HeinzGomez - Práctica 10: sonda de liveness para Docker/Kubernetes.

La imagen no trae curl ni wget, así que el healthcheck del contenedor se resuelve
con el propio intérprete: `python -m app.observabilidad.healthcheck`.
"""
from __future__ import annotations

import os
import sys
import urllib.error
import urllib.request

PUERTO_POR_DEFECTO = "8094"


def verificar(puerto: int, host: str = "127.0.0.1", espera_s: float = 2.0) -> bool:
    """True si `/health` responde 200. No lanza: solo informa el resultado."""
    try:
        with urllib.request.urlopen(f"http://{host}:{puerto}/health", timeout=espera_s) as respuesta:
            return respuesta.status == 200
    except (urllib.error.URLError, TimeoutError, OSError):
        return False


def main() -> int:
    return 0 if verificar(int(os.getenv("PUERTO", PUERTO_POR_DEFECTO))) else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
