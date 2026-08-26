from redis import Redis

from .environment import get_config

_client: Redis | None = None


def get_redis() -> Redis:
    global _client
    if _client is None:
        cfg = get_config()
        _client = Redis(
            host=cfg.REDIS_HOST,
            port=cfg.REDIS_PORT,
            password=cfg.REDIS_PASSWORD or None,
            db=cfg.REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _client


def close_redis() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
