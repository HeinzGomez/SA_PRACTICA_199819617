"""HeinzGomez - Práctica 9: casos de uso de certificados (CDU 3.7 emisión, 4.1/4.2 consulta,
4.3/4.4 verificación). La firma y el payload canónico no cambian: solo se conservan."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Callable, List, Optional

from ..domain import Certificado, CertificadosError, Firmador
from ..repository.base import RepositorioCertificados, RepositorioExamen
from .reloj import ahora, iso, parse


class CertificadosCasos:
    def __init__(self, examenes: RepositorioExamen, certificados: RepositorioCertificados,
                 firmador: Firmador, reloj: Callable[[], datetime] = ahora):
        self.examenes = examenes
        self.certificados = certificados
        self.firmador = firmador
        self.reloj = reloj

    def generar_certificado(self, usuario_id: str, evento_id: str, nombre_estudiante: str,
                            evento_titulo: str, curso_codigo: str, curso_nombre: str = "") -> Certificado:
        if not nombre_estudiante or not evento_titulo or not curso_codigo:
            raise CertificadosError("INVALID_ARGUMENT", "Faltan datos del estudiante o de la actividad")
        existente = self.certificados.certificado_de(usuario_id, evento_id)
        if existente:
            return existente  # idempotente: un diploma por estudiante y actividad
        aprobados = [i for i in self.examenes.intentos_de(usuario_id, evento_id) if i.aprobado]
        if not aprobados:
            raise CertificadosError("FAILED_PRECONDITION", "No tiene aprobado el examen de certificación")
        cert = Certificado(
            id=f"CERT-{uuid.uuid4().hex[:10].upper()}", usuario_id=usuario_id,
            nombre_estudiante=nombre_estudiante.strip(), evento_id=evento_id, evento_titulo=evento_titulo,
            curso_codigo=curso_codigo, curso_nombre=curso_nombre,
            nota=max(i.nota for i in aprobados), emitido_en=iso(self.reloj()),
        )
        self.firmador.firmar(cert)
        self.certificados.guardar_certificado(cert)
        return cert

    def listar(self, usuario_id: str, curso_codigo: str = "", fecha_desde: str = "",
               fecha_hasta: str = "") -> List[Certificado]:
        if not usuario_id:
            raise CertificadosError("INVALID_ARGUMENT", "usuario_id es obligatorio")
        desde = parse(fecha_desde) if fecha_desde else None
        hasta = parse(fecha_hasta + ("T23:59:59Z" if len(fecha_hasta) == 10 else "")) if fecha_hasta else None
        salida = []
        for c in self.certificados.certificados_de_usuario(usuario_id):
            emitido = parse(c.emitido_en)
            if curso_codigo and c.curso_codigo != curso_codigo:
                continue
            if desde and emitido < desde:
                continue
            if hasta and emitido > hasta:
                continue
            salida.append(c)
        return sorted(salida, key=lambda c: c.emitido_en, reverse=True)

    def verificar(self, codigo: str) -> tuple[bool, str, Optional[Certificado]]:
        codigo = (codigo or "").strip()
        if not codigo:
            raise CertificadosError("INVALID_ARGUMENT", "Ingrese el identificador o hash del diploma")
        cert = self.certificados.buscar_certificado(codigo) or self.certificados.buscar_certificado(codigo.upper()) \
            or self.certificados.buscar_certificado(codigo.lower())
        if not cert:
            return False, "Certificado inválido: no existe en el registro académico", None
        if not self.firmador.verificar(cert):
            return False, "Certificado inválido: la firma digital no coincide (documento alterado)", cert
        return True, "Certificado válido, emitido y firmado por FIUSAC – Academix", cert
