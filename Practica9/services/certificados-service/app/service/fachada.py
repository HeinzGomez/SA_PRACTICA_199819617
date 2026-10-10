"""HeinzGomez - Práctica 9: fachada del Servicio de Certificados.

Único punto de entrada para el controlador RPC y para el consumidor de reservas: delega en los
casos de uso (inscripciones, examen, certificados) manteniendo la superficie pública que ya
usaban las pruebas y el adaptador gRPC anterior.
"""
from __future__ import annotations

from datetime import datetime
from typing import Callable, List, Optional

from ..domain import Certificado, CertificadosError, Firmador, Intento
from ..repository.base import RepositorioCertificados, RepositorioExamen, RepositorioInscripciones
from .certificados import CertificadosCasos
from .examen import ExamenCasos
from .inscripciones import Inscripciones
from .reloj import ahora


class CertificadosService:
    def __init__(self, repo, firmador: Firmador, reloj: Callable[[], datetime] = ahora):
        self.repo = repo
        self.firmador = firmador
        self.reloj = reloj
        inscripciones_repo: RepositorioInscripciones = repo
        examenes_repo: RepositorioExamen = repo
        certificados_repo: RepositorioCertificados = repo
        self.inscripciones = Inscripciones(inscripciones_repo)
        self.examen = ExamenCasos(self.inscripciones, examenes_repo, reloj)
        self.certificado = CertificadosCasos(examenes_repo, certificados_repo, firmador, reloj)

    # --- consumidor RabbitMQ: reserva.confirmada -> habilita examen/certificado
    def registrar_inscripcion(self, mensaje: dict) -> None:
        self.inscripciones.registrar_inscripcion(mensaje)

    # --- CDU 3.6
    def obtener_examen(self, evento_id: str, usuario_id: str) -> dict:
        return self.examen.obtener_examen(evento_id, usuario_id)

    def rendir_examen(self, usuario_id: str, evento_id: str, respuestas: dict) -> Intento:
        return self.examen.rendir_examen(usuario_id, evento_id, respuestas)

    # --- administración de exámenes
    def obtener_examen_admin(self, evento_id: str) -> dict:
        """Consulta del examen con sus respuestas correctas (no exige inscripción)."""
        return self.examen.obtener_examen_admin(evento_id)

    def crear_examen(self, evento_id: str, titulo: str, puntaje_minimo=None, estado: Optional[str] = None) -> dict:
        return self.examen.crear_examen(evento_id, titulo, puntaje_minimo, estado)

    def agregar_pregunta(self, id_examen, enunciado: str, opciones: List[dict], punteo=None) -> dict:
        return self.examen.agregar_pregunta(id_examen, enunciado, opciones, punteo)

    # --- CDU 3.7
    def generar_certificado(self, usuario_id: str, evento_id: str, nombre_estudiante: str,
                            evento_titulo: str, curso_codigo: str, curso_nombre: str = "") -> Certificado:
        return self.certificado.generar_certificado(usuario_id, evento_id, nombre_estudiante,
                                                    evento_titulo, curso_codigo, curso_nombre)

    # --- CDU 4.1 / 4.2
    def listar(self, usuario_id: str, curso_codigo: str = "", fecha_desde: str = "",
               fecha_hasta: str = "") -> List[Certificado]:
        return self.certificado.listar(usuario_id, curso_codigo, fecha_desde, fecha_hasta)

    # --- CDU 4.3 / 4.4
    def verificar(self, codigo: str) -> tuple[bool, str, Optional[Certificado]]:
        return self.certificado.verificar(codigo)


__all__ = ["CertificadosService", "CertificadosError"]
