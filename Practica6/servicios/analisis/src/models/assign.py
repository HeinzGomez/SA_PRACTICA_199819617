from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class AsignarTemaClaseParams:
    id_clase: int
    id_tema: int


@dataclass
class DesasignarTemaClaseParams:
    id_clase: int
    id_tema: int


@dataclass
class TemaAsignado:
    id_tema: int
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class ConsultarTemasClaseResult:
    id_clase: int
    registros: List[TemaAsignado] = field(default_factory=list)
