import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASS: str

    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    REDIS_DB: int

    GRPC_PORT: int
    HTTP_PORT: int


def _required(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(
            f"La variable de entorno '{key}' es requerida pero no está definida"
        )
    return value


def _required_int(key: str) -> int:
    value = _required(key)
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(
            f"La variable de entorno '{key}' debe ser un número entero"
        ) from exc


def _optional_int(key: str, default: int) -> int:
    value = os.getenv(key)
    if not value:
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise ValueError(
            f"La variable de entorno '{key}' debe ser un número entero"
        ) from exc


def _load() -> Config:
    return Config(
        DB_HOST=_required("ANAL_DB_HOST"),
        DB_PORT=_required_int("ANAL_DB_PORT"),
        DB_NAME=_required("ANAL_DB_NAME"),
        DB_USER=_required("ANAL_DB_USER"),
        DB_PASS=_required("ANAL_DB_PASS"),
        REDIS_HOST=os.getenv("ANAL_REDIS_HOST") or "localhost",
        REDIS_PORT=_optional_int("ANAL_REDIS_PORT", 6379),
        REDIS_PASSWORD=os.getenv("ANAL_REDIS_PASSWORD", ""),
        REDIS_DB=_optional_int("ANAL_REDIS_DB", 0),
        GRPC_PORT=_required_int("ANAL_GRPC_PORT"),
        HTTP_PORT=_required_int("ANAL_HTTP_PORT"),
    )


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = _load()
    return _config
