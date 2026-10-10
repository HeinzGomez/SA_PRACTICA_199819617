"""HeinzGomez - Práctica 9: modelos del dominio (puras structs, sin dependencias externas)."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from typing import Dict, FrozenSet, List, Optional


@dataclass(frozen=True)
class Pregunta:
    """Una pregunta puede tener una o varias opciones marcadas como correctas.

    `correctas` guarda los ids de esas opciones; el estudiante responde con una sola
    y acierta si esa respuesta pertenece al conjunto."""
    id: str
    enunciado: str
    opciones: Dict[str, str]
    correctas: FrozenSet[str] = field(default_factory=frozenset)
    punteo: float = 0.0

    def es_correcta(self, opcion_id: Optional[str]) -> bool:
        return bool(opcion_id) and opcion_id in self.correctas


@dataclass
class Examen:
    """Examen de acreditación de una actividad (tabla Examen_Acreditacion)."""
    id: int
    id_actividad: str
    titulo: str
    puntaje_minimo: float
    estado: str
    preguntas: List[Pregunta] = field(default_factory=list)

    @property
    def activo(self) -> bool:
        return self.estado == "ACTIVO"


@dataclass
class Intento:
    id: str
    usuario_id: str
    evento_id: str
    nota: int
    aprobado: bool
    correctas: int
    total: int
    respondido_en: str
    id_examen: Optional[int] = None


@dataclass
class Certificado:
    id: str
    usuario_id: str
    nombre_estudiante: str
    evento_id: str
    evento_titulo: str
    curso_codigo: str
    curso_nombre: str
    nota: int
    emitido_en: str
    codigo_hash: str = ""
    firma: str = ""

    def payload_canonico(self) -> bytes:
        """Campos firmados, en orden estable. Cualquier alteración invalida hash y firma."""
        datos = {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "nombre_estudiante": self.nombre_estudiante,
            "evento_id": self.evento_id,
            "evento_titulo": self.evento_titulo,
            "curso_codigo": self.curso_codigo,
            "nota": self.nota,
            "emitido_en": self.emitido_en,
            "emisor": "USAC-FIUSAC-ACADEMIX",
        }
        return json.dumps(datos, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    def to_dict(self) -> dict:
        return asdict(self)
