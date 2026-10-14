"""HeinzGomez - Práctica 9: inscripciones (mensajes de reserva confirmada -> tabla inscripcion)."""
from __future__ import annotations

from ..domain import CertificadosError
from ..repository.base import RepositorioInscripciones


class Inscripciones:
    def __init__(self, repo: RepositorioInscripciones):
        self.repo = repo

    def registrar_inscripcion(self, mensaje: dict) -> None:
        usuario, evento = mensaje.get("usuarioId"), mensaje.get("eventoId")
        if not usuario or not evento:
            raise CertificadosError("INVALID_ARGUMENT", "Mensaje de reserva incompleto")
        self.repo.registrar_inscripcion(usuario, evento, mensaje.get("ticketId", ""))

    def exigir_inscripcion(self, usuario_id: str, evento_id: str) -> None:
        if not usuario_id or not evento_id:
            raise CertificadosError("INVALID_ARGUMENT", "usuario_id y evento_id son obligatorios")
        if not self.repo.esta_inscrito(usuario_id, evento_id):
            raise CertificadosError("FAILED_PRECONDITION",
                                    "Debe tener una reserva CONFIRMADA en la actividad para rendir el examen")
