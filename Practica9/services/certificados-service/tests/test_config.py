"""HeinzGomez - Práctica 9: pruebas de la configuración por variables de entorno."""
from __future__ import annotations

import pytest

from app import config


def test_valores_por_defecto(monkeypatch):
    for var in ("DATABASE_URL", "RABBITMQ_URL", "CERT_SIGNING_SEED", "RPC_PREFETCH"):
        monkeypatch.delenv(var, raising=False)
    e = config.leer_entorno()
    assert e.database_url == "postgresql://academix:academix@localhost:5432/certificados_db"
    assert e.rabbitmq_url.startswith("amqp://")
    assert e.cert_signing_seed == "dev-seed-cambiar"
    assert e.rpc_prefetch == 20
    assert e.database_url != "" and e.rabbitmq_url != ""


def test_lee_lo_que_haya_en_el_entorno(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://otro:clave@db:5432/otra")
    monkeypatch.setenv("RABBITMQ_URL", "amqp://otro:otro@broker:5672/%2f")
    monkeypatch.setenv("CERT_SIGNING_SEED", "produccion-2026")
    monkeypatch.setenv("RPC_PREFETCH", "7")
    e = config.leer_entorno()
    assert e.database_url == "postgresql://otro:clave@db:5432/otra"
    assert e.rabbitmq_url == "amqp://otro:otro@broker:5672/%2f"
    assert e.cert_signing_seed == "produccion-2026"
    assert e.rpc_prefetch == 7


def test_prefetch_no_numerico_no_se_traga(monkeypatch):
    """Un valor corrupto debe explotar al arrancar, no quedar silenciosamente en 0."""
    monkeypatch.setenv("RPC_PREFETCH", "veinte")
    with pytest.raises(ValueError):
        config.leer_entorno()


def test_entorno_es_inmutable():
    e = config.Entorno(database_url="a", rabbitmq_url="b", cert_signing_seed="c", rpc_prefetch=1)
    with pytest.raises(Exception):
        e.database_url = "otra"  # type: ignore[misc]


def test_el_punto_de_entrada_importa_sin_infraestructura():
    """`app.main` solo debe poder importarse: los hilos/brokers están detrás de main()."""
    import app.main
    assert callable(app.main.main)
    assert callable(app.main.conectar_db)
