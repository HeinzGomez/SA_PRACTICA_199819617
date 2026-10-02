"""HeinzGomez - Práctica 7: dominio del Servicio de Certificados.

- Banco de preguntas y calificación del examen de certificación (CDU 3.6)
- Payload canónico, hash SHA-256 y firma digital Ed25519 del diploma (CDU 3.7, 4.4)
"""
from __future__ import annotations

import base64
import hashlib
import json
from dataclasses import asdict, dataclass, field
from typing import Dict, List, Optional

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

NOTA_MINIMA = 70
MAX_INTENTOS = 3


class CertificadosError(Exception):
    """code: INVALID_ARGUMENT | NOT_FOUND | FAILED_PRECONDITION | RESOURCE_EXHAUSTED"""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class Pregunta:
    id: str
    enunciado: str
    opciones: Dict[str, str]
    correcta: str


@dataclass
class Intento:
    id: str
    usuario_id: str
    evento_id: str
    nota: int
    aprobado: bool
    correctas: int
    total: int
    respondido_en: str


@dataclass
class Certificado:
    id: str
    usuario_id: str
    nombre_estudiante: str
    evento_id: str
    evento_titulo: str
    curso_codigo: str
    curso_nombre: str
    nota: int
    emitido_en: str
    codigo_hash: str = ""
    firma: str = ""

    def payload_canonico(self) -> bytes:
        """Campos firmados, en orden estable. Cualquier alteración invalida hash y firma."""
        datos = {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "nombre_estudiante": self.nombre_estudiante,
            "evento_id": self.evento_id,
            "evento_titulo": self.evento_titulo,
            "curso_codigo": self.curso_codigo,
            "nota": self.nota,
            "emitido_en": self.emitido_en,
            "emisor": "USAC-FIUSAC-ACADEMIX",
        }
        return json.dumps(datos, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    def to_dict(self) -> dict:
        return asdict(self)


_GENERICAS: List[Pregunta] = [
    Pregunta("g1", "¿Qué patrón desacopla productores y consumidores mediante una cola?",
             {"a": "Singleton", "b": "Message Queue / Pub-Sub", "c": "MVC", "d": "Decorator"}, "b"),
    Pregunta("g2", "¿Qué garantiza una operación idempotente?",
             {"a": "Que se ejecuta más rápido", "b": "Que nunca falla",
              "c": "Que repetirla produce el mismo resultado", "d": "Que es asíncrona"}, "c"),
    Pregunta("g3", "En SOA, ¿qué describe el contrato de un servicio?",
             {"a": "Su interfaz y mensajes", "b": "Su base de datos interna", "c": "El lenguaje usado", "d": "El servidor físico"}, "a"),
    Pregunta("g4", "¿Qué algoritmo produce un resumen de 256 bits?",
             {"a": "MD5", "b": "SHA-1", "c": "SHA-256", "d": "Base64"}, "c"),
    Pregunta("g5", "¿Qué componente orquesta contenedores en producción en este proyecto?",
             {"a": "Kubernetes (GKE)", "b": "Vercel", "c": "Redis", "d": "RabbitMQ"}, "a"),
]

BANCO: Dict[str, List[Pregunta]] = {
    "evt-sec-04": [
        Pregunta("s1", "¿Qué riesgo del OWASP API Top 10 ocupa el primer lugar (2023)?",
                 {"a": "Inyección SQL", "b": "Broken Object Level Authorization", "c": "XSS", "d": "CSRF"}, "b"),
        Pregunta("s2", "¿Qué parte de un JWT garantiza su integridad?",
                 {"a": "Header", "b": "Payload", "c": "Firma", "d": "El campo exp"}, "c"),
        Pregunta("s3", "¿Qué mitiga el rate limiting?",
                 {"a": "Consumo irrestricto de recursos", "b": "SSRF", "c": "Fuga de logs", "d": "CORS"}, "a"),
        Pregunta("s4", "¿Dónde NO se debe almacenar un secreto de firma JWT?",
                 {"a": "Gestor de secretos", "b": "Variable de entorno", "c": "Repositorio de código", "d": "Kubernetes Secret"}, "c"),
        Pregunta("s5", "¿Qué cabecera HTTP transporta normalmente el token Bearer?",
                 {"a": "Cookie", "b": "Authorization", "c": "Accept", "d": "Host"}, "b"),
    ],
}


def preguntas_para(evento_id: str) -> List[Pregunta]:
    return BANCO.get(evento_id, _GENERICAS)


def calificar(evento_id: str, respuestas: Dict[str, str]) -> tuple[int, int, int]:
    """Devuelve (nota 0-100, correctas, total)."""
    preguntas = preguntas_para(evento_id)
    correctas = sum(1 for p in preguntas if respuestas.get(p.id) == p.correcta)
    total = len(preguntas)
    nota = round(correctas * 100 / total) if total else 0
    return nota, correctas, total


class Firmador:
    """Firma Ed25519. La llave privada se deriva de un secreto (CERT_SIGNING_SEED) para que
    todas las réplicas del servicio firmen y verifiquen con la misma llave."""

    def __init__(self, seed: str):
        if not seed:
            raise ValueError("CERT_SIGNING_SEED es obligatorio")
        self._priv = Ed25519PrivateKey.from_private_bytes(hashlib.sha256(seed.encode()).digest())
        self.publica: Ed25519PublicKey = self._priv.public_key()

    @staticmethod
    def hash(payload: bytes) -> str:
        return hashlib.sha256(payload).hexdigest()

    def firmar(self, cert: Certificado) -> Certificado:
        payload = cert.payload_canonico()
        cert.codigo_hash = self.hash(payload)
        cert.firma = base64.b64encode(self._priv.sign(payload)).decode()
        return cert

    def verificar(self, cert: Certificado) -> bool:
        payload = cert.payload_canonico()
        if self.hash(payload) != cert.codigo_hash:
            return False
        try:
            self.publica.verify(base64.b64decode(cert.firma), payload)
            return True
        except (InvalidSignature, ValueError):
            return False
