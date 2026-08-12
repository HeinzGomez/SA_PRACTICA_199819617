import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    grpc_port: str = os.getenv("GRPC_PORT", "50053")
    http_port: str = os.getenv("HTTP_PORT", "8083")

    db_host: str = os.getenv("DB_HOST", "analytics-db")
    db_port: str = os.getenv("DB_PORT", "5432")
    db_name: str = os.getenv("DB_NAME", "analytics_db")
    db_user: str = os.getenv("DB_USER", "analytics_user")
    db_password: str = os.getenv("DB_PASSWORD", "analytics_pass")

    redis_host: str = os.getenv("REDIS_HOST", "redis")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_password: str = os.getenv("REDIS_PASSWORD", "")
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))

    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from: str = os.getenv("SMTP_FROM", "notificaciones@yousac.ingenieria.usac.edu.gt")


settings = Settings()
