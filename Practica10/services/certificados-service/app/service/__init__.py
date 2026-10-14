"""HeinzGomez - Práctica 9: casos de uso del Servicio de Certificados (CDU 3.4 - 3.7, 4.1 - 4.4)."""
from __future__ import annotations

from .certificados import CertificadosCasos
from .examen import ExamenCasos
from .fachada import CertificadosService
from .inscripciones import Inscripciones

__all__ = ["CertificadosCasos", "CertificadosService", "ExamenCasos", "Inscripciones"]
