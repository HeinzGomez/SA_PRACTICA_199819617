import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASS: str

    HOST_SMTP: str
    PORT_SMTP: int
    FROM_SMTP: str
    PASS_SMTP: str

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


def _load() -> Config:
    return Config(
        DB_HOST=_required("NOT_DB_HOST"),
        DB_PORT=_required_int("NOT_DB_PORT"),
        DB_NAME=_required("NOT_DB_NAME"),
        DB_USER=_required("NOT_DB_USER"),
        DB_PASS=_required("NOT_DB_PASS"),
        HOST_SMTP=_required("NOTIFICATION_HOST_SMTP"),
        PORT_SMTP=_required_int("NOTIFICATION_PORT_SMTP"),
        FROM_SMTP=_required("NOTIFICATION_FROM_SMTP"),
        PASS_SMTP=_required("NOTIFICATION_PASS_SMTP"),
        GRPC_PORT=_required_int("NOT_GRPC_PORT"),
        HTTP_PORT=_required_int("NOT_HTTP_PORT"),
    )


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = _load()
    return _config
