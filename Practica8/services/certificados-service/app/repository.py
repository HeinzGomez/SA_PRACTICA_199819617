"""HeinzGomez - Práctica 7: persistencia del Servicio de Certificados (memoria y PostgreSQL)."""
from __future__ import annotations

import threading
from typing import List, Optional

from .domain import Certificado, Intento


class InMemoryRepository:
    def __init__(self):
        self._lock = threading.Lock()
        self.inscripciones: set[tuple[str, str]] = set()
        self.intentos: List[Intento] = []
        self.certificados: dict[str, Certificado] = {}

    def registrar_inscripcion(self, usuario_id: str, evento_id: str, ticket_id: str) -> None:
        with self._lock:
            self.inscripciones.add((usuario_id, evento_id))

    def esta_inscrito(self, usuario_id: str, evento_id: str) -> bool:
        return (usuario_id, evento_id) in self.inscripciones

    def guardar_intento(self, i: Intento) -> None:
        with self._lock:
            self.intentos.append(i)

    def intentos_de(self, usuario_id: str, evento_id: str) -> List[Intento]:
        return [i for i in self.intentos if i.usuario_id == usuario_id and i.evento_id == evento_id]

    def guardar_certificado(self, c: Certificado) -> None:
        with self._lock:
            self.certificados[c.id] = c

    def certificado_de(self, usuario_id: str, evento_id: str) -> Optional[Certificado]:
        return next((c for c in self.certificados.values()
                     if c.usuario_id == usuario_id and c.evento_id == evento_id), None)

    def buscar_certificado(self, codigo: str) -> Optional[Certificado]:
        if codigo in self.certificados:
            return self.certificados[codigo]
        return next((c for c in self.certificados.values() if c.codigo_hash == codigo), None)

    def certificados_de_usuario(self, usuario_id: str) -> List[Certificado]:
        return [c for c in self.certificados.values() if c.usuario_id == usuario_id]


MIGRACION = """
CREATE TABLE IF NOT EXISTS inscripcion (
  usuario_id    VARCHAR(64) NOT NULL,
  evento_id     VARCHAR(40) NOT NULL,
  ticket_id     VARCHAR(20) NOT NULL,
  confirmada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, evento_id)
);
CREATE TABLE IF NOT EXISTS intento_examen (
  id            VARCHAR(40) PRIMARY KEY,
  usuario_id    VARCHAR(64) NOT NULL,
  evento_id     VARCHAR(40) NOT NULL,
  nota          SMALLINT NOT NULL CHECK (nota BETWEEN 0 AND 100),
  aprobado      BOOLEAN NOT NULL,
  correctas     SMALLINT NOT NULL,
  total         SMALLINT NOT NULL,
  respondido_en TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (usuario_id, evento_id) REFERENCES inscripcion(usuario_id, evento_id)
);
CREATE TABLE IF NOT EXISTS certificado (
  id                VARCHAR(40) PRIMARY KEY,
  codigo_hash       CHAR(64) NOT NULL UNIQUE,
  firma             TEXT NOT NULL,
  usuario_id        VARCHAR(64) NOT NULL,
  nombre_estudiante VARCHAR(150) NOT NULL,
  evento_id         VARCHAR(40) NOT NULL,
  evento_titulo     VARCHAR(200) NOT NULL,
  curso_codigo      VARCHAR(10) NOT NULL,
  curso_nombre      VARCHAR(120),
  nota              SMALLINT NOT NULL,
  emitido_en        TIMESTAMPTZ NOT NULL,
  UNIQUE (usuario_id, evento_id)
);
"""


class PostgresRepository:  # pragma: no cover - requiere base de datos real
    def __init__(self, dsn: str):
        import psycopg
        from psycopg.rows import dict_row

        self._conn = psycopg.connect(dsn, autocommit=True, row_factory=dict_row)
        self._lock = threading.Lock()
        with self._lock:
            self._conn.execute(MIGRACION)

    def _q(self, sql: str, params: tuple = ()):
        with self._lock:
            return self._conn.execute(sql, params).fetchall() if sql.lstrip().upper().startswith("SELECT") \
                else self._conn.execute(sql, params)

    def registrar_inscripcion(self, usuario_id, evento_id, ticket_id):
        self._q("INSERT INTO inscripcion (usuario_id, evento_id, ticket_id) VALUES (%s,%s,%s) "
                "ON CONFLICT DO NOTHING", (usuario_id, evento_id, ticket_id))

    def esta_inscrito(self, usuario_id, evento_id):
        return bool(self._q("SELECT 1 FROM inscripcion WHERE usuario_id=%s AND evento_id=%s", (usuario_id, evento_id)))

    def guardar_intento(self, i: Intento):
        self._q("INSERT INTO intento_examen VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (i.id, i.usuario_id, i.evento_id, i.nota, i.aprobado, i.correctas, i.total, i.respondido_en))

    def intentos_de(self, usuario_id, evento_id):
        rows = self._q("SELECT * FROM intento_examen WHERE usuario_id=%s AND evento_id=%s", (usuario_id, evento_id))
        return [Intento(**{**r, "respondido_en": r["respondido_en"].isoformat()}) for r in rows]

    def guardar_certificado(self, c: Certificado):
        self._q("INSERT INTO certificado (id,codigo_hash,firma,usuario_id,nombre_estudiante,evento_id,evento_titulo,"
                "curso_codigo,curso_nombre,nota,emitido_en) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (c.id, c.codigo_hash, c.firma, c.usuario_id, c.nombre_estudiante, c.evento_id, c.evento_titulo,
                 c.curso_codigo, c.curso_nombre, c.nota, c.emitido_en))

    @staticmethod
    def _cert(r) -> Certificado:
        return Certificado(**{**r, "emitido_en": r["emitido_en"].isoformat().replace("+00:00", "Z"),
                              "codigo_hash": r["codigo_hash"].strip()})

    def certificado_de(self, usuario_id, evento_id):
        rows = self._q("SELECT * FROM certificado WHERE usuario_id=%s AND evento_id=%s", (usuario_id, evento_id))
        return self._cert(rows[0]) if rows else None

    def buscar_certificado(self, codigo):
        rows = self._q("SELECT * FROM certificado WHERE id=%s OR codigo_hash=%s", (codigo, codigo))
        return self._cert(rows[0]) if rows else None

    def certificados_de_usuario(self, usuario_id):
        return [self._cert(r) for r in self._q("SELECT * FROM certificado WHERE usuario_id=%s", (usuario_id,))]
