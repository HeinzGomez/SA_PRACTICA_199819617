"""HeinzGomez - Práctica 9: errores del dominio de Certificados.

Los códigos son exactamente los que ya consumía el contrato gRPC y que el API Gateway
traduce a HTTP: INVALID_ARGUMENT 400, NOT_FOUND 404, FAILED_PRECONDITION 409,
RESOURCE_EXHAUSTED 429, INTERNAL 500.
"""
from __future__ import annotations

CODIGOS_VALIDOS = ("INVALID_ARGUMENT", "NOT_FOUND", "FAILED_PRECONDITION", "RESOURCE_EXHAUSTED", "INTERNAL")


class CertificadosError(Exception):
    """Error de negocio: se responde como {ok:false, error:{codigo, mensaje}}."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message
