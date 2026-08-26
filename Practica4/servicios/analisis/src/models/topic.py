from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Unidad:
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class RegistrarUnidadParams:
    nombre: str
    descripcion: Optional[str]


@dataclass
class EditarUnidadParams:
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class ConsultarUnidadesParams:
    pagina: int


@dataclass
class ConsultarUnidadesResult:
    registros: List[Unidad] = field(default_factory=list)
    total_paginas: int = 0


@dataclass
class Tema:
    id_tema: int
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class RegistrarTemaParams:
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class EditarTemaParams:
    id_tema: int
    id_unidad: int
    nombre: str
    descripcion: Optional[str]


@dataclass
class ConsultarTemasParams:
    pagina: int
    id_unidad: int = 0


@dataclass
class ConsultarTemasResult:
    registros: List[Tema] = field(default_factory=list)
    total_paginas: int = 0
