"""HeinzGomez - Práctica 9: firma digital del diploma (Ed25519 + hash SHA-256)."""
from __future__ import annotations

import base64
import hashlib

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from .modelos import Certificado


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
