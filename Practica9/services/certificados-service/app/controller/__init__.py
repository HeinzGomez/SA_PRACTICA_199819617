"""HeinzGomez - Práctica 9: adaptador de entrada del Servicio de Certificados.

Reemplaza al servidor gRPC (app/grpc_server.py, puerto 50054): cada operación llega por la
cola RPC con su routing key y se responde en el mismo formato JSON que usaba el contrato
proto (snake_case, ids como texto, listas con la misma clave), para que el API Gateway y el
frontend no cambien.

Contrato de respuesta:
	{"ok": true,  "datos": ...}                       -> 200/201/202 en el gateway
	{"ok": false, "error": {"codigo", "mensaje"}}     -> codigo -> HTTP
"""
from __future__ import annotations

import json
import logging
from typing import Any, Callable, Dict, List

from ..domain import Certificado, CertificadosError
from ..service import CertificadosService

log = logging.getLogger("certificados.rpc")

# routing key -> (decodificador, caso de uso, codificador)
Manejador = Callable[[bytes], Any]


def _cuerpo(c: bytes) -> dict:
    try:
        datos = json.loads(c or b"{}")
    except ValueError:
        raise CertificadosError("INVALID_ARGUMENT", "El cuerpo de la petición no es JSON válido")
    if not isinstance(datos, dict):
        raise CertificadosError("INVALID_ARGUMENT", "El cuerpo de la petición debe ser un objeto JSON")
    return datos


def _textos(datos: dict, *claves: str) -> List[str]:
    return [str(datos.get(k, "") or "") for k in claves]


class Controlador:
    """Expone las operaciones del servicio al contrato del broker (OCP: agregar una operación
    es agregar una entrada en _tabla, sin tocar el consumidor RPC)."""

    def __init__(self, svc: CertificadosService):
        self.svc = svc
        self._tabla: Dict[str, Manejador] = {
            "certificados.obtener_examen": self._obtener_examen,
            "certificados.rendir_examen": self._rendir_examen,
            "certificados.generar_certificado": self._generar_certificado,
            "certificados.listar_certificados": self._listar_certificados,
            "certificados.verificar_certificado": self._verificar_certificado,
            "certificados.obtener_examen_admin": self._obtener_examen_admin,
            "certificados.crear_examen": self._crear_examen,
            "certificados.agregar_pregunta": self._agregar_pregunta,
        }

    @property
    def operaciones(self) -> List[str]:
        return list(self._tabla)

    def despachar(self, operacion: str, cuerpo: bytes) -> bytes:
        """Devuelve el JSON de la respuesta. Solo lanza si la operación no existe
        (entonces el broker manda el mensaje a la DLQ en vez de perderlo)."""
        manejador = self._tabla.get(operacion)
        if manejador is None:
            raise CertificadosError("NOT_FOUND", f"Operación no soportada: {operacion}")
        try:
            datos = manejador(cuerpo)
        except CertificadosError as e:
            return _falla(e.code, e.message)
        except Exception as e:  # noqa: BLE001 - error interno: no se filtra al cliente
            log.exception("%s falló: %s", operacion, e)
            return _falla("INTERNAL", "Error interno")
        return _ok(datos)

    # --- CDU 3.6
    def _obtener_examen(self, cuerpo: bytes) -> dict:
        evento_id, usuario_id = _textos(_cuerpo(cuerpo), "evento_id", "usuario_id")
        return self.svc.obtener_examen(evento_id, usuario_id)

    def _rendir_examen(self, cuerpo: bytes) -> dict:
        datos = _cuerpo(cuerpo)
        usuario_id, evento_id = _textos(datos, "usuario_id", "evento_id")
        respuestas = datos.get("respuestas") or []
        if not isinstance(respuestas, list):
            raise CertificadosError("INVALID_ARGUMENT", "respuestas debe ser una lista")
        mapa = {str(r.get("pregunta_id", "")): str(r.get("opcion_id", ""))
                for r in respuestas if isinstance(r, dict)}
        intento = self.svc.rendir_examen(usuario_id, evento_id, mapa)
        return {"intento_id": intento.id, "aprobado": intento.aprobado, "nota": intento.nota,
                "correctas": intento.correctas, "total": intento.total}

    # --- administración
    def _obtener_examen_admin(self, cuerpo: bytes) -> dict:
        evento_id, = _textos(_cuerpo(cuerpo), "evento_id")
        return self.svc.obtener_examen_admin(evento_id)

    def _crear_examen(self, cuerpo: bytes) -> dict:
        datos = _cuerpo(cuerpo)
        evento_id, titulo = _textos(datos, "evento_id", "titulo")
        return self.svc.crear_examen(evento_id, titulo, datos.get("puntaje_minimo"), datos.get("estado"))

    def _agregar_pregunta(self, cuerpo: bytes) -> dict:
        datos = _cuerpo(cuerpo)
        enunciado, = _textos(datos, "enunciado")
        opciones = datos.get("opciones") or []
        if not isinstance(opciones, list):
            raise CertificadosError("INVALID_ARGUMENT", "opciones debe ser una lista")
        return self.svc.agregar_pregunta(datos.get("id_examen"), enunciado, opciones, datos.get("punteo"))

    # --- CDU 3.7
    def _generar_certificado(self, cuerpo: bytes) -> dict:
        datos = _cuerpo(cuerpo)
        usuario_id, evento_id, nombre, titulo, codigo, nombre_curso = _textos(
            datos, "usuario_id", "evento_id", "nombre_estudiante", "evento_titulo", "curso_codigo", "curso_nombre")
        cert = self.svc.generar_certificado(usuario_id, evento_id, nombre, titulo, codigo, nombre_curso)
        return cert.to_dict()

    # --- CDU 4.1 / 4.2
    def _listar_certificados(self, cuerpo: bytes) -> dict:
        datos = _cuerpo(cuerpo)
        usuario_id, curso, desde, hasta = _textos(datos, "usuario_id", "curso_codigo", "fecha_desde", "fecha_hasta")
        certs: List[Certificado] = self.svc.listar(usuario_id, curso, desde, hasta)
        return {"certificados": [c.to_dict() for c in certs]}

    # --- CDU 4.3 / 4.4
    def _verificar_certificado(self, cuerpo: bytes) -> dict:
        codigo, = _textos(_cuerpo(cuerpo), "codigo")
        valido, mensaje, cert = self.svc.verificar(codigo)
        return {"valido": valido, "mensaje": mensaje,
                "certificado": cert.to_dict() if cert and valido else None}


def _ok(datos: Any) -> bytes:
    return json.dumps({"ok": True, "datos": datos}, ensure_ascii=False).encode("utf-8")


def _falla(codigo: str, mensaje: str) -> bytes:
    return json.dumps({"ok": False, "error": {"codigo": codigo, "mensaje": mensaje}},
                      ensure_ascii=False).encode("utf-8")
