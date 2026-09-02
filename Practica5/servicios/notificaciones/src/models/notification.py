from dataclasses import dataclass, field
from typing import List


@dataclass
class Notificacion:
    id_notificacion: int
    id_usuario: int
    tipo: str
    asunto: str
    mensaje: str
    fecha_envio: str
    estado: str


@dataclass
class RegistrarNotificacionParams:
    id_usuario: int
    tipo: str
    asunto: str
    mensaje: str


@dataclass
class ConsultarNotificacionesParams:
    id_usuario: int
    pagina: int


@dataclass
class ConsultarNotificacionesResult:
    registros: List[Notificacion] = field(default_factory=list)
    total_paginas: int = 0
