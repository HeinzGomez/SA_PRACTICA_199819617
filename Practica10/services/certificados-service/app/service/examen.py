"""HeinzGomez - Práctica 9: casos de uso del examen de acreditación (CDU 3.6) y de su
administración (crear examen de una actividad y agregarle preguntas con sus opciones).

Las preguntas salen de la base de datos; este módulo solo aplica las reglas de negocio.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Callable, Dict, List, Optional

from ..domain import (ESTADOS_EXAMEN, ESTADO_ACTIVO, MAX_INTENTOS, NOTA_MINIMA, CertificadosError,
                      Examen, Intento, calificar)
from ..repository.base import RepositorioExamen
from .inscripciones import Inscripciones
from .reloj import ahora, iso


def examen_a_json(examen: Examen) -> dict:
    return {
        "id_examen": examen.id,
        "evento_id": examen.id_actividad,
        "titulo": examen.titulo,
        "puntaje_minimo": examen.puntaje_minimo,
        "estado": examen.estado,
        "preguntas": [{"id_pregunta": p.id, "enunciado": p.enunciado, "punteo": p.punteo,
                       "opciones": [{"id_opcion": k, "texto": v, "es_correcta": k in p.correctas}
                                    for k, v in p.opciones.items()]}
                      for p in examen.preguntas],
    }


class ExamenCasos:
    def __init__(self, inscripciones: Inscripciones, examenes: RepositorioExamen,
                 reloj: Callable[[], datetime] = ahora):
        self.inscripciones = inscripciones
        self.examenes = examenes
        self.reloj = reloj

    # --- consulta y calificación (CDU 3.6)
    def obtener_examen(self, evento_id: str, usuario_id: str) -> dict:
        self.inscripciones.exigir_inscripcion(usuario_id, evento_id)
        examen = self._exigir_examen(evento_id)
        return {
            "evento_id": evento_id,
            "nota_minima": round(examen.puntaje_minimo),
            "preguntas": [{"id": p.id, "enunciado": p.enunciado,
                           "opciones": [{"id": k, "texto": v} for k, v in p.opciones.items()]}
                          for p in examen.preguntas],
        }

    def rendir_examen(self, usuario_id: str, evento_id: str, respuestas: Dict[str, str]) -> Intento:
        self.inscripciones.exigir_inscripcion(usuario_id, evento_id)
        examen = self._exigir_examen(evento_id)
        previos = self.examenes.intentos_de(usuario_id, evento_id)
        if any(i.aprobado for i in previos):
            raise CertificadosError("FAILED_PRECONDITION", "El examen ya fue aprobado")
        if len(previos) >= MAX_INTENTOS:
            raise CertificadosError("RESOURCE_EXHAUSTED", f"Se agotaron los {MAX_INTENTOS} intentos permitidos")
        nota, correctas, total = calificar(examen.preguntas, respuestas)
        intento = Intento(id=f"INT-{uuid.uuid4().hex[:12].upper()}", usuario_id=usuario_id, evento_id=evento_id,
                          nota=nota, aprobado=nota >= examen.puntaje_minimo, correctas=correctas, total=total,
                          respondido_en=iso(self.reloj()), id_examen=examen.id)
        self.examenes.guardar_intento(intento)
        return intento

    # --- administración: crear el examen de una actividad
    def crear_examen(self, evento_id: str, titulo: str, puntaje_minimo=None, estado: Optional[str] = None) -> dict:
        evento_id, titulo = (evento_id or "").strip(), (titulo or "").strip()
        if not evento_id or not titulo:
            raise CertificadosError("INVALID_ARGUMENT", "evento_id y titulo son obligatorios")
        estado = (estado or ESTADO_ACTIVO).strip().upper()
        if estado not in ESTADOS_EXAMEN:
            raise CertificadosError("INVALID_ARGUMENT", f"estado debe ser {'|'.join(ESTADOS_EXAMEN)}")
        if puntaje_minimo is None:
            puntaje_minimo = NOTA_MINIMA
        try:
            puntaje_minimo = float(puntaje_minimo)
        except (TypeError, ValueError):
            raise CertificadosError("INVALID_ARGUMENT", "puntaje_minimo debe ser numérico")
        if not 0 <= puntaje_minimo <= 100:
            raise CertificadosError("INVALID_ARGUMENT", "puntaje_minimo debe estar entre 0 y 100")
        if self.examenes.examen_de(evento_id) is not None:
            raise CertificadosError("FAILED_PRECONDITION", "La actividad ya tiene un examen configurado")
        return examen_a_json(self.examenes.crear_examen(evento_id, titulo, puntaje_minimo, estado))

    # --- administración: agregar preguntas (con opciones) a un examen
    def agregar_pregunta(self, id_examen, enunciado: str, opciones: List[dict], punteo=None) -> dict:
        try:
            examen_id = int(id_examen)
        except (TypeError, ValueError):
            raise CertificadosError("INVALID_ARGUMENT", "id_examen debe ser numérico")
        if self.examenes.examen_por_id(examen_id) is None:
            raise CertificadosError("NOT_FOUND", "El examen indicado no existe")
        enunciado = (enunciado or "").strip()
        if not enunciado:
            raise CertificadosError("INVALID_ARGUMENT", "enunciado es obligatorio")
        if not isinstance(opciones, list) or len(opciones) < 2:
            raise CertificadosError("INVALID_ARGUMENT", "Se requieren al menos 2 opciones")
        textos = [(o or {}).get("texto", "").strip() if isinstance(o, dict) else str(o or "").strip()
                  for o in opciones]
        if any(not t for t in textos):
            raise CertificadosError("INVALID_ARGUMENT", "Las opciones no pueden estar vacías")
        marcadas = {i for i, o in enumerate(opciones)
                    if isinstance(o, dict) and bool(o.get("es_correcta"))}
        if not marcadas:
            raise CertificadosError("INVALID_ARGUMENT", "Debe marcar al menos una opción como correcta")
        if punteo is None:
            punteo = round(100.0 / (self.examenes.contar_preguntas(examen_id) + 1), 2)
        else:
            try:
                punteo = float(punteo)
            except (TypeError, ValueError):
                raise CertificadosError("INVALID_ARGUMENT", "punteo debe ser numérico")
            if punteo < 0:
                raise CertificadosError("INVALID_ARGUMENT", "punteo no puede ser negativo")
        pregunta = self.examenes.agregar_pregunta(
            examen_id, enunciado, punteo, [(texto, i in marcadas) for i, texto in enumerate(textos)])
        return {
            "id_pregunta": pregunta.id,
            "id_examen": examen_id,
            "enunciado": pregunta.enunciado,
            "punteo": pregunta.punteo,
            "opciones": [{"id_opcion": k, "texto": v, "es_correcta": k in pregunta.correctas}
                         for k, v in pregunta.opciones.items()],
        }

    # --- administración: consulta del examen sin exigir inscripción (rol ADMINISTRADOR)
    def obtener_examen_admin(self, evento_id: str) -> dict:
        examen = self.examenes.examen_de(evento_id)
        if examen is None:
            raise CertificadosError("NOT_FOUND", "La actividad aún no tiene un examen configurado")
        return examen_a_json(examen)

    def _exigir_examen(self, evento_id: str) -> Examen:
        examen = self.examenes.examen_de(evento_id)
        if examen is None:
            raise CertificadosError("FAILED_PRECONDITION", "La actividad no tiene un examen configurado")
        if not examen.activo:
            raise CertificadosError("FAILED_PRECONDITION", "El examen no está activo")
        return examen
