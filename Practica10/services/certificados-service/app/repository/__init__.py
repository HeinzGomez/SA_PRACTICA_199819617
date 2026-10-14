"""HeinzGomez - Práctica 9: persistencia del Servicio de Certificados."""
from __future__ import annotations

from .base import RepositorioCertificados, RepositorioExamen, RepositorioInscripciones
from .memoria import InMemoryRepository
from .postgres import PostgresRepository

__all__ = [
    "InMemoryRepository",
    "PostgresRepository",
    "RepositorioCertificados",
    "RepositorioExamen",
    "RepositorioInscripciones",
]
