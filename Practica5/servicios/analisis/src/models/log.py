from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AuditLog:
    id_auditoria: int
    usuario_responsable: int
    operacion: str
    tabla_afectada: str
    fecha_evento: str
    estado_anterior: Optional[Dict[str, Any]]
    estado_nuevo: Optional[Dict[str, Any]]


@dataclass
class ConsultarAuditLogsParams:
    pagina: int
    tabla_afectada: str = ""
    operacion: str = ""
    usuario_responsable: int = 0


@dataclass
class ConsultarAuditLogsResult:
    registros: List[AuditLog] = field(default_factory=list)
    total_paginas: int = 0
