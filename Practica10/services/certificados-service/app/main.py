"""HeinzGomez - Práctica 10: arranque del Servicio de Certificados.

Antes levantaba un servidor gRPC en :50054; ahora el API Gateway le envía las peticiones
por la cola RPC de RabbitMQ. Además expone `/health`, `/health/ready` y `/metrics` en el
puerto del entorno (8094 por defecto) para el liveness/readiness de Kubernetes/compose y
el scraping de Prometheus.

Composition root: este es el único módulo que conoce las implementaciones concretas
(Prometheus, logging y el repositorio); el resto del código depende de interfaces.
"""
from __future__ import annotations

import logging
import threading
import time

from . import broker, config
from .broker import consumidor, rpc
from .controller import Controlador
from .domain import Firmador
from .observabilidad import (Metricas, ServidorObservabilidad, SondasDeProceso,
                             configurar_logging, sonda_de_llamada)
from .repository import PostgresRepository
from .service import CertificadosService

log = logging.getLogger("certificados.main")


def conectar_db(dsn: str) -> PostgresRepository:  # pragma: no cover
    for i in range(30):
        try:
            return PostgresRepository(dsn)
        except Exception as e:  # noqa: BLE001 - el servicio espera a la base de datos
            log.warning("postgres intento %s fallido: %s", i + 1, e)
            time.sleep(2)
    raise SystemExit("postgres no disponible")


def main() -> None:  # pragma: no cover
    configurar_logging()
    entorno = config.leer_entorno()
    metricas = Metricas()

    repo = conectar_db(entorno.database_url)
    svc = CertificadosService(repo, Firmador(entorno.cert_signing_seed))
    controlador = Controlador(svc, metricas)

    servidor = ServidorObservabilidad(
        entorno.puerto,
        metricas,
        SondasDeProceso(
            broker_listo=lambda: metricas.broker_conectado,
            base_datos_lista=sonda_de_llamada(repo.listo),
        ),
    )
    servidor.arrancar()

    threading.Thread(target=consumidor.iniciar, args=(entorno.rabbitmq_url, svc, metricas),
                     daemon=True).start()
    threading.Thread(target=rpc.iniciar,
                     args=(entorno.rabbitmq_url, entorno.rpc_prefetch, controlador, metricas),
                     daemon=True).start()

    log.info("certificados-service listo: cola %s + eventos %s (prefetch=%s, puerto=%s)",
             broker.COLA_RPC, broker.COLA_INSCRIPCIONES, entorno.rpc_prefetch, servidor.puerto)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        log.info("certificados-service deteniendo…")
        servidor.detener()


if __name__ == "__main__":  # pragma: no cover
    main()
