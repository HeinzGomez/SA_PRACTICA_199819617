from dataclasses import dataclass
from typing import List, Optional


@dataclass
class RegistrarVisualizacionParams:
    id_clase: int


@dataclass
class VisualizacionClase:
    id_clase: int
    titulo: str
    total_visualizaciones: int


@dataclass
class RegistrarCalificacionParams:
    id_clase: int
    id_usuario: int
    puntuacion: int


@dataclass
class CalificacionClase:
    id_clase: int
    promedio: float
    total_calificaciones: int


@dataclass
class CalificacionUsuario:
    id_clase: int
    id_usuario: int
    puntuacion: int
    promedio: float
    total_calificaciones: int


@dataclass
class ConsultarClasesMasVistasParams:
    fecha_inicio: str
    fecha_fin: str
    limite: int = 0


@dataclass
class ClaseMasVista:
    id_clase: int
    titulo: str
    total_visualizaciones: int


@dataclass
class ConsultarTemasTendenciaParams:
    fecha_inicio: str
    fecha_fin: str
    limite: int = 0


@dataclass
class TemaTendencia:
    id_tema: int
    nombre: str
    unidad: str
    total_visualizaciones: int


@dataclass
class ConsultarRankingValoradasParams:
    limite: int = 0


@dataclass
class ClaseValorada:
    id_clase: int
    titulo: str
    promedio: float
    total_calificaciones: int
