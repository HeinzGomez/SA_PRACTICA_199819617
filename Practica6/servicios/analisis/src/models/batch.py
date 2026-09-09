from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ClaseCargaInput:
    id_curso: int
    id_periodo: int
    id_area: int
    titulo: str
    fecha_impartida: str
    duracion_min: int
    descripcion: Optional[str] = None
    url_video: Optional[str] = None
    anio: Optional[int] = None
    num_semestre: Optional[int] = None


@dataclass
class BatchClaseResult:
    index: int
    status: str
    message: Optional[str] = None
    id_clase: Optional[int] = None


@dataclass
class BatchClaseResponse:
    exito: bool
    mensaje: str
    resultados: List[BatchClaseResult] = field(default_factory=list)