"""HeinzGomez - Práctica 9: repositorio en memoria (pruebas). Mismas interfaces que Postgres."""
from __future__ import annotations

import threading
from typing import List, Optional, Sequence, Tuple

from ..domain import Certificado, Examen, Intento, Pregunta
from .esquema import ESTADO_SEMILLA, PUNTAJE_MINIMO, SEMILLA, preguntas_de_semilla


class InMemoryRepository:
    def __init__(self):
        self._lock = threading.Lock()
        self.inscripciones: set[tuple[str, str]] = set()
        self.intentos: List[Intento] = []
        self.certificados: dict[str, Certificado] = {}
        self.examenes: dict[str, Examen] = {}
        self._siguiente_examen = 1
        self._siguiente_pregunta = 1
        for id_actividad, titulo, _preguntas in SEMILLA:
            self.examenes[id_actividad] = Examen(
                id=self._tomar_examen(), id_actividad=id_actividad, titulo=titulo,
                puntaje_minimo=PUNTAJE_MINIMO, estado=ESTADO_SEMILLA,
                preguntas=preguntas_de_semilla(id_actividad),
            )

    def _tomar_examen(self) -> int:
        valor = self._siguiente_examen
        self._siguiente_examen += 1
        return valor

    # --- inscripciones
    def registrar_inscripcion(self, usuario_id: str, evento_id: str, ticket_id: str) -> None:
        with self._lock:
            self.inscripciones.add((usuario_id, evento_id))

    def esta_inscrito(self, usuario_id: str, evento_id: str) -> bool:
        return (usuario_id, evento_id) in self.inscripciones

    # --- exámenes
    def examen_de(self, evento_id: str) -> Optional[Examen]:
        return self.examenes.get(evento_id)

    def examen_por_id(self, examen_id: int) -> Optional[Examen]:
        return next((e for e in self.examenes.values() if e.id == examen_id), None)

    def crear_examen(self, evento_id: str, titulo: str, puntaje_minimo: float, estado: str) -> Examen:
        with self._lock:
            examen = Examen(id=self._tomar_examen(), id_actividad=evento_id, titulo=titulo,
                            puntaje_minimo=puntaje_minimo, estado=estado, preguntas=[])
            self.examenes[evento_id] = examen
            return examen

    def agregar_pregunta(self, examen_id: int, enunciado: str, punteo: float,
                         opciones: Sequence[Tuple[str, bool]]) -> Pregunta:
        with self._lock:
            identificador = self._siguiente_pregunta
            self._siguiente_pregunta += 1
            textos = {f"{identificador}-{i}": texto for i, (texto, _ok) in enumerate(opciones)}
            correctas = frozenset(f"{identificador}-{i}" for i, (_t, ok) in enumerate(opciones) if ok)
            pregunta = Pregunta(id=str(identificador), enunciado=enunciado, opciones=textos,
                                correctas=correctas, punteo=punteo)
            for examen in self.examenes.values():
                if examen.id == examen_id:
                    examen.preguntas.append(pregunta)
                    return pregunta
            raise KeyError(f"examen {examen_id} no existe")

    def contar_preguntas(self, examen_id: int) -> int:
        return sum(len(e.preguntas) for e in self.examenes.values() if e.id == examen_id)

    # --- intentos
    def guardar_intento(self, intento: Intento) -> None:
        with self._lock:
            self.intentos.append(intento)

    def intentos_de(self, usuario_id: str, evento_id: str) -> List[Intento]:
        return [i for i in self.intentos if i.usuario_id == usuario_id and i.evento_id == evento_id]

    # --- certificados
    def guardar_certificado(self, c: Certificado) -> None:
        with self._lock:
            self.certificados[c.id] = c

    def certificado_de(self, usuario_id: str, evento_id: str) -> Optional[Certificado]:
        return next((c for c in self.certificados.values()
                     if c.usuario_id == usuario_id and c.evento_id == evento_id), None)

    def buscar_certificado(self, codigo: str) -> Optional[Certificado]:
        if codigo in self.certificados:
            return self.certificados[codigo]
        return next((c for c in self.certificados.values() if c.codigo_hash == codigo), None)

    def certificados_de_usuario(self, usuario_id: str) -> List[Certificado]:
        return [c for c in self.certificados.values() if c.usuario_id == usuario_id]
