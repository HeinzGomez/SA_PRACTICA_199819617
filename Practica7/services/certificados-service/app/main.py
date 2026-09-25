"""HeinzGomez - Práctica 7: arranque del Servicio de Certificados (gRPC :50054 + consumidor)."""
from __future__ import annotations

import logging
import os
import threading
import time
from concurrent import futures

import grpc
from grpc_health.v1 import health, health_pb2_grpc

from . import consumer
from .domain import Firmador
from .grpc_server import registrar
from .repository import PostgresRepository
from .service import CertificadosService


def conectar_db(dsn: str) -> PostgresRepository:  # pragma: no cover
    for i in range(30):
        try:
            return PostgresRepository(dsn)
        except Exception as e:
            logging.warning("postgres intento %s fallido: %s", i + 1, e)
            time.sleep(2)
    raise SystemExit("postgres no disponible")


def main() -> None:  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    repo = conectar_db(os.getenv("DATABASE_URL", "postgresql://academix:academix@localhost:5432/certificados_db"))
    svc = CertificadosService(repo, Firmador(os.getenv("CERT_SIGNING_SEED", "dev-seed-cambiar")))

    threading.Thread(target=consumer.iniciar, args=(os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"), svc),
                     daemon=True).start()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=16))
    registrar(server, svc)
    health_pb2_grpc.add_HealthServicer_to_server(health.HealthServicer(), server)
    port = os.getenv("GRPC_PORT", "50054")
    server.add_insecure_port(f"0.0.0.0:{port}")
    server.start()
    logging.info("certificados-service gRPC en :%s", port)
    server.wait_for_termination()


if __name__ == "__main__":  # pragma: no cover
    main()
