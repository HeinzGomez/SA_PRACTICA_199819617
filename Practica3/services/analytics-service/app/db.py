import psycopg2
import psycopg2.extras

from app.config import settings


def get_connection():
    """Conexion EXCLUSIVA de analytics-service a su propia base de datos
    PostgreSQL (patron Database per Microservice)."""
    return psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        dbname=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
