from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ClaseGrabada:
    id_clase: int
    id_curso: int
    id_periodo: int
    id_area: int
    titulo: str
    fecha_impartida: str
    duracio_min: int
    descripcion: Optional[str]
    url_video: str
    anio: int
    num_semestre: int


@dataclass
class RegistrarClaseParams:
    id_curso: int
    id_periodo: int
    id_area: int
    titulo: str
    fecha_impartida: str
    duracion: int
    descripcion: Optional[str]
    url_video: str
    anio: int
    num_semestre: int


@dataclass
class EditarClaseParams:
    id_clase: int
    id_curso: int
    id_periodo: int
    id_area: int
    titulo: str
    fecha_impartida: str
    duracion: int
    descripcion: Optional[str]
    url_video: str
    anio: int
    num_semestre: int


@dataclass
class ConsultarCatalogoParams:
    pagina: int
    id_curso: int = 0
    id_periodo: int = 0
    id_area: int = 0
    anio: int = 0


@dataclass
class ConsultarCatalogoResult:
    registros: List[ClaseGrabada] = field(default_factory=list)
    total_paginas: int = 0
