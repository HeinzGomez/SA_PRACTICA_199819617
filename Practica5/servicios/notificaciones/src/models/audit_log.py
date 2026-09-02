from dataclasses import dataclass, field
from typing import List


@dataclass
class AuditLog:
    id_auditoria: int
    usuario_responsable: int
    operacion: str
    tabla_afectada: str
    fecha_evento: str
    estado_anterior: str
    estado_nuevo: str


@dataclass
class ConsultarAuditLogsParams:
    pagina: int
    usuario_filtro: int = 0
    tabla_filtro: str = ""


@dataclass
class ConsultarAuditLogsResult:
    registros: List[AuditLog] = field(default_factory=list)
    total_paginas: int = 0
