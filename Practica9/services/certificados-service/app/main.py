"""HeinzGomez - Práctica 9: arranque del Servicio de Certificados.

Antes levantaba un servidor gRPC en :50054; ahora el API Gateway le envía las peticiones
por la cola RPC de RabbitMQ y este proceso solo queda atendiendo (RPC + eventos de reserva).
"""
from __future__ import annotations

import logging
import threading
import time

from . import broker, config
from .broker import consumidor, rpc
from .controller import Controlador
from .domain import Firmador
from .repository import PostgresRepository
from .service import CertificadosService


def conectar_db(dsn: str) -> PostgresRepository:  # pragma: no cover
    for i in range(30):
        try:
            return PostgresRepository(dsn)
        except Exception as e:  # noqa: BLE001 - el servicio espera a la base de datos
            logging.warning("postgres intento %s fallido: %s", i + 1, e)
            time.sleep(2)
    raise SystemExit("postgres no disponible")


def main() -> None:  # pragma: no cover
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    entorno = config.leer_entorno()
    repo = conectar_db(entorno.database_url)
    svc = CertificadosService(repo, Firmador(entorno.cert_signing_seed))
    controlador = Controlador(svc)

    threading.Thread(target=consumidor.iniciar, args=(entorno.rabbitmq_url, svc), daemon=True).start()
    threading.Thread(target=rpc.iniciar,
                     args=(entorno.rabbitmq_url, entorno.rpc_prefetch, controlador), daemon=True).start()

    logging.info("certificados-service listo: cola %s + eventos %s (prefetch=%s)",
                 broker.COLA_RPC, broker.COLA_INSCRIPCIONES, entorno.rpc_prefetch)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        logging.info("certificados-service deteniendo…")


if __name__ == "__main__":  # pragma: no cover
    main()
