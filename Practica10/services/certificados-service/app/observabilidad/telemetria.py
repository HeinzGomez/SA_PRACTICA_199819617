"""HeinzGomez - Práctica 10: contrato de telemetría del Servicio de Certificados.

El broker y el controlador dependen de ESTE protocolo, nunca de `prometheus_client`
(DIP): cualquier implementación (la real, una doble en pruebas o la no-op) basta
para sustituirla sin tocar el código de negocio (LSP).
"""
from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class Telemetria(Protocol):
    """Lo que la instrumentación necesita saber del proceso (ISP: cinco métodos chicos)."""

    def rpc(self, operacion: str, ms: float, estado: str) -> None:
        """Una llamada RPC atendida. `estado`: "ok" si se respondió, "error" si fue a la DLQ."""
        ...

    def broker(self, conectado: bool) -> None:
        """Estado de la conexión con RabbitMQ (True = conectado)."""
        ...

    def inscripcion(self, estado: str) -> None:
        """Mensaje de "reserva.confirmada" procesado. `estado`: "aceptada" | "descartada"."""
        ...

    def examen(self, resultado: str) -> None:
        """Examen rendido. `resultado`: "aprobado" | "reprobado"."""
        ...

    def certificado_emitido(self) -> None:
        """Se emitió un certificado nuevo (CDU 3.7)."""
        ...


class TelemetriaNula:
    """No hace nada: valor por defecto de todas las firmas y de las pruebas."""

    def rpc(self, operacion: str, ms: float, estado: str) -> None:
        return None

    def broker(self, conectado: bool) -> None:
        return None

    def inscripcion(self, estado: str) -> None:
        return None

    def examen(self, resultado: str) -> None:
        return None

    def certificado_emitido(self) -> None:
        return None
