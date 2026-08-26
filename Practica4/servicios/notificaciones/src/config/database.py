import psycopg2
import psycopg2.pool
from psycopg2.pool import ThreadedConnectionPool

from .environment import get_config

_pool: ThreadedConnectionPool | None = None


def get_database() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        cfg = get_config()
        _pool = ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            host=cfg.DB_HOST,
            port=cfg.DB_PORT,
            dbname=cfg.DB_NAME,
            user=cfg.DB_USER,
            password=cfg.DB_PASS,
            connect_timeout=10,
        )
    return _pool


def get_connection():
    return get_database().getconn()


def release_connection(conn) -> None:
    if conn is not None:
        get_database().putconn(conn)


def close_database() -> None:
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
