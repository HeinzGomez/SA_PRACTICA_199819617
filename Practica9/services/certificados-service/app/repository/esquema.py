"""HeinzGomez - Práctica 9: esquema (DDL) y semilla de la base de datos del Servicio de Certificados.

El DDL sigue ejecutándose al conectar (sin migraciones versionadas, como hasta ahora) y ya no
hay preguntas en el código: están en las tablas Examen_Acreditacion / Preguntas / Opciono.

Nota sobre mayúsculas: los identificadores sin comillas en PostgreSQL se guardan en minúscula,
por eso el DDL usa Examen_Acreditacion/Preguntas/Opciono tal como en el diagrama y las queries
las referencian en minúscula.
"""
from __future__ import annotations

from typing import List

from ..domain import Pregunta

MIGRACION = """
CREATE TABLE IF NOT EXISTS inscripcion (
  usuario_id    VARCHAR(64) NOT NULL,
  evento_id     VARCHAR(40) NOT NULL,
  ticket_id     VARCHAR(20) NOT NULL,
  confirmada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, evento_id)
);

CREATE TABLE IF NOT EXISTS Examen_Acreditacion (
  id_examen      SERIAL PRIMARY KEY,
  id_actividad   VARCHAR(40),
  titulo_examen  VARCHAR(255) NOT NULL,
  puntaje_minimo NUMERIC(5,2),
  estado         VARCHAR(50),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Preguntas (
  id_pregunta   SERIAL PRIMARY KEY,
  id_examen     INT NOT NULL,
  enunciado     TEXT NOT NULL,
  punteo        NUMERIC(5,2),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_examen
      FOREIGN KEY (id_examen)
      REFERENCES Examen_Acreditacion(id_examen)
      ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Opciono (
  id_opcion     SERIAL PRIMARY KEY,
  id_pregunta   INT NOT NULL,
  opcion        TEXT NOT NULL,
  esCorrecta    BOOLEAN,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pregunta
      FOREIGN KEY (id_pregunta)
      REFERENCES Preguntas(id_pregunta)
      ON DELETE CASCADE
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
  id_examen     INT,
  FOREIGN KEY (usuario_id, evento_id) REFERENCES inscripcion(usuario_id, evento_id),
  CONSTRAINT fk_intento_examen
      FOREIGN KEY (id_examen)
      REFERENCES Examen_Acreditacion(id_examen)
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

CREATE INDEX IF NOT EXISTS idx_examen_acreditacion_actividad ON examen_acreditacion(id_actividad);
"""

PUNTAJE_MINIMO = 70.0
PUNTEO_PREGUNTA = 20.0
ESTADO_SEMILLA = "ACTIVO"

# (evento_id, titulo_del_examen, [(enunciado, [opciones], indice_de_la_correcta), ...])
_GENERICAS = [
    ("¿Qué patrón desacopla productores y consumidores mediante una cola?",
     ["Singleton", "Message Queue / Pub-Sub", "MVC", "Decorator"], 1),
    ("¿Qué garantiza una operación idempotente?",
     ["Que se ejecuta más rápido", "Que nunca falla",
      "Que repetirla produce el mismo resultado", "Que es asíncrona"], 2),
    ("En SOA, ¿qué describe el contrato de un servicio?",
     ["Su interfaz y mensajes", "Su base de datos interna", "El lenguaje usado", "El servidor físico"], 0),
    ("¿Qué algoritmo produce un resumen de 256 bits?", ["MD5", "SHA-1", "SHA-256", "Base64"], 2),
    ("¿Qué componente orquesta contenedores en producción en este proyecto?",
     ["Kubernetes (GKE)", "Vercel", "Redis", "RabbitMQ"], 0),
]

_SEGURIDAD = [
    ("¿Qué riesgo del OWASP API Top 10 ocupa el primer lugar (2023)?",
     ["Inyección SQL", "Broken Object Level Authorization", "XSS", "CSRF"], 1),
    ("¿Qué parte de un JWT garantiza su integridad?", ["Header", "Payload", "Firma", "El campo exp"], 2),
    ("¿Qué mitiga el rate limiting?",
     ["Consumo irrestricto de recursos", "SSRF", "Fuga de logs", "CORS"], 0),
    ("¿Dónde NO se debe almacenar un secreto de firma JWT?",
     ["Gestor de secretos", "Variable de entorno", "Repositorio de código", "Kubernetes Secret"], 2),
    ("¿Qué cabecera HTTP transporta normalmente el token Bearer?",
     ["Cookie", "Authorization", "Accept", "Host"], 1),
]

SEMILLA = [
    ("evt-sec-04", "Examen de certificación: Seguridad en APIs (OWASP API Top 10)", _SEGURIDAD),
    ("evt-k8s-01", "Examen de certificación: Kubernetes y GKE desde cero", _GENERICAS),
    ("evt-sql-03", "Examen de certificación: Optimización de consultas en PostgreSQL", _GENERICAS),
    ("evt-ci-05", "Examen de certificación: CI/CD con GitHub Actions y Container Registry", _GENERICAS),
]


def preguntas_de_semilla(evento_id: str) -> List[Pregunta]:
    """Preguntas del banco sembrado, como modelos de dominio (las usa el repositorio en memoria)."""
    for id_actividad, _titulo, preguntas in SEMILLA:
        if id_actividad != evento_id:
            continue
        salida: List[Pregunta] = []
        for numero, (enunciado, opciones, correcta) in enumerate(preguntas, start=1):
            textos = {str(numero * 10 + i): texto for i, texto in enumerate(opciones)}
            salida.append(Pregunta(id=str(numero), enunciado=enunciado, opciones=textos,
                                   correctas=frozenset({str(numero * 10 + correcta)}),
                                   punteo=PUNTEO_PREGUNTA))
        return salida
    return []


def sembrar(conn) -> None:
    """Inserta los exámenes iniciales una sola vez (idempotente: no toca datos existentes)."""
    fila = conn.execute("SELECT COUNT(*) AS n FROM examen_acreditacion").fetchone()
    if fila["n"]:
        return
    for id_actividad, titulo, preguntas in SEMILLA:
        examen = conn.execute(
            "INSERT INTO examen_acreditacion (id_actividad, titulo_examen, puntaje_minimo, estado) "
            "VALUES (%s,%s,%s,%s) RETURNING id_examen",
            (id_actividad, titulo, PUNTAJE_MINIMO, ESTADO_SEMILLA),
        ).fetchone()
        for enunciado, opciones, correcta in preguntas:
            pregunta = conn.execute(
                "INSERT INTO preguntas (id_examen, enunciado, punteo) VALUES (%s,%s,%s) RETURNING id_pregunta",
                (examen["id_examen"], enunciado, PUNTEO_PREGUNTA),
            ).fetchone()
            for indice, texto in enumerate(opciones):
                conn.execute(
                    "INSERT INTO opciono (id_pregunta, opcion, esCorrecta) VALUES (%s,%s,%s)",
                    (pregunta["id_pregunta"], texto, indice == correcta),
                )
