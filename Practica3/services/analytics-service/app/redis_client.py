import json

import redis

from app.config import settings

# Cliente Redis obligatorio (ver enunciado): cachea las consultas mas
# frecuentes de tendencias/catalogo con politicas TTL, evitando sobrecargar
# la base de datos durante picos de concurrencia (epoca de examenes).
_redis_client = redis.Redis(
    host=settings.redis_host,
    port=settings.redis_port,
    password=settings.redis_password or None,
    decode_responses=True,
)


def cache_get(key: str):
    raw = _redis_client.get(key)
    return json.loads(raw) if raw else None


def cache_set(key: str, value, ttl_seconds: int | None = None):
    _redis_client.set(key, json.dumps(value, default=str), ex=ttl_seconds or settings.cache_ttl_seconds)


def cache_delete(key: str):
    _redis_client.delete(key)
