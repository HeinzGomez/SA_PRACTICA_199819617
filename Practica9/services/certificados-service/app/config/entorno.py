"""HeinzGomez - Práctica 9: lectura centralizada de variables de entorno (SRP)."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Entorno:
    database_url: str
    rabbitmq_url: str
    cert_signing_seed: str
    rpc_prefetch: int


def leer_entorno() -> Entorno:
    return Entorno(
        database_url=os.getenv("DATABASE_URL",
                               "postgresql://academix:academix@localhost:5432/certificados_db"),
        rabbitmq_url=os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
        cert_signing_seed=os.getenv("CERT_SIGNING_SEED", "dev-seed-cambiar"),
        rpc_prefetch=int(os.getenv("RPC_PREFETCH", "20")),
    )
