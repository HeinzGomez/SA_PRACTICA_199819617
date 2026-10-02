"""HeinzGomez - Práctica 7: casos de uso del Servicio de Certificados (CDU 3.4 - 3.7, 4.1 - 4.4)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Callable, Dict, List, Optional

from .domain import (MAX_INTENTOS, NOTA_MINIMA, Certificado, CertificadosError, Firmador, Intento,
                     calificar, preguntas_para)


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _parse(s: str) -> datetime:
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class CertificadosService:
    def __init__(self, repo, firmador: Firmador, reloj: Callable[[], datetime] = _ahora):
        self.repo = repo
        self.firmador = firmador
        self.reloj = reloj

    # --- Consumidor RabbitMQ: reserva.confirmada -> habilita examen/certificado
    def registrar_inscripcion(self, mensaje: dict) -> None:
        usuario, evento = mensaje.get("usuarioId"), mensaje.get("eventoId")
        if not usuario or not evento:
            raise CertificadosError("INVALID_ARGUMENT", "Mensaje de reserva incompleto")
        self.repo.registrar_inscripcion(usuario, evento, mensaje.get("ticketId", ""))

    def _exigir_inscripcion(self, usuario_id: str, evento_id: str) -> None:
        if not usuario_id or not evento_id:
            raise CertificadosError("INVALID_ARGUMENT", "usuario_id y evento_id son obligatorios")
        if not self.repo.esta_inscrito(usuario_id, evento_id):
            raise CertificadosError("FAILED_PRECONDITION",
                                    "Debe tener una reserva CONFIRMADA en la actividad para rendir el examen")

    # --- CDU 3.6
    def obtener_examen(self, evento_id: str, usuario_id: str) -> dict:
        self._exigir_inscripcion(usuario_id, evento_id)
        return {
            "evento_id": evento_id,
            "nota_minima": NOTA_MINIMA,
            "preguntas": [{"id": p.id, "enunciado": p.enunciado,
                           "opciones": [{"id": k, "texto": v} for k, v in p.opciones.items()]}
                          for p in preguntas_para(evento_id)],
        }

    def rendir_examen(self, usuario_id: str, evento_id: str, respuestas: Dict[str, str]) -> Intento:
        self._exigir_inscripcion(usuario_id, evento_id)
        previos = self.repo.intentos_de(usuario_id, evento_id)
        if any(i.aprobado for i in previos):
            raise CertificadosError("FAILED_PRECONDITION", "El examen ya fue aprobado")
        if len(previos) >= MAX_INTENTOS:
            raise CertificadosError("RESOURCE_EXHAUSTED", f"Se agotaron los {MAX_INTENTOS} intentos permitidos")
        nota, correctas, total = calificar(evento_id, respuestas)
        intento = Intento(id=f"INT-{uuid.uuid4().hex[:12].upper()}", usuario_id=usuario_id, evento_id=evento_id,
                          nota=nota, aprobado=nota >= NOTA_MINIMA, correctas=correctas, total=total,
                          respondido_en=_iso(self.reloj()))
        self.repo.guardar_intento(intento)
        return intento

    # --- CDU 3.7
    def generar_certificado(self, usuario_id: str, evento_id: str, nombre_estudiante: str,
                            evento_titulo: str, curso_codigo: str, curso_nombre: str = "") -> Certificado:
        if not nombre_estudiante or not evento_titulo or not curso_codigo:
            raise CertificadosError("INVALID_ARGUMENT", "Faltan datos del estudiante o de la actividad")
        existente = self.repo.certificado_de(usuario_id, evento_id)
        if existente:
            return existente  # idempotente: un diploma por estudiante y actividad
        aprobados = [i for i in self.repo.intentos_de(usuario_id, evento_id) if i.aprobado]
        if not aprobados:
            raise CertificadosError("FAILED_PRECONDITION", "No tiene aprobado el examen de certificación")
        cert = Certificado(
            id=f"CERT-{uuid.uuid4().hex[:10].upper()}", usuario_id=usuario_id, nombre_estudiante=nombre_estudiante.strip(),
            evento_id=evento_id, evento_titulo=evento_titulo, curso_codigo=curso_codigo, curso_nombre=curso_nombre,
            nota=max(i.nota for i in aprobados), emitido_en=_iso(self.reloj()),
        )
        self.firmador.firmar(cert)
        self.repo.guardar_certificado(cert)
        return cert

    # --- CDU 4.1 / 4.2
    def listar(self, usuario_id: str, curso_codigo: str = "", fecha_desde: str = "",
               fecha_hasta: str = "") -> List[Certificado]:
        if not usuario_id:
            raise CertificadosError("INVALID_ARGUMENT", "usuario_id es obligatorio")
        desde = _parse(fecha_desde) if fecha_desde else None
        hasta = _parse(fecha_hasta + ("T23:59:59Z" if len(fecha_hasta) == 10 else "")) if fecha_hasta else None
        out = []
        for c in self.repo.certificados_de_usuario(usuario_id):
            emitido = _parse(c.emitido_en)
            if curso_codigo and c.curso_codigo != curso_codigo:
                continue
            if desde and emitido < desde:
                continue
            if hasta and emitido > hasta:
                continue
            out.append(c)
        return sorted(out, key=lambda c: c.emitido_en, reverse=True)

    # --- CDU 4.3 / 4.4 (vista pública)
    def verificar(self, codigo: str) -> tuple[bool, str, Optional[Certificado]]:
        codigo = (codigo or "").strip()
        if not codigo:
            raise CertificadosError("INVALID_ARGUMENT", "Ingrese el identificador o hash del diploma")
        cert = self.repo.buscar_certificado(codigo) or self.repo.buscar_certificado(codigo.upper()) \
            or self.repo.buscar_certificado(codigo.lower())
        if not cert:
            return False, "Certificado inválido: no existe en el registro académico", None
        if not self.firmador.verificar(cert):
            return False, "Certificado inválido: la firma digital no coincide (documento alterado)", cert
        return True, "Certificado válido, emitido y firmado por FIUSAC – Academix", cert
