"""HeinzGomez - Práctica 7: adaptador gRPC (contrato proto/certificados.proto)."""
from __future__ import annotations

import grpc

from .domain import Certificado, CertificadosError
from .gen import certificados_pb2 as pb  # noqa: F401  (el paquete gen ajusta sys.path)
from .gen import certificados_pb2_grpc as pb_grpc
from .service import CertificadosService

CODIGOS = {
    "INVALID_ARGUMENT": grpc.StatusCode.INVALID_ARGUMENT,
    "NOT_FOUND": grpc.StatusCode.NOT_FOUND,
    "FAILED_PRECONDITION": grpc.StatusCode.FAILED_PRECONDITION,
    "RESOURCE_EXHAUSTED": grpc.StatusCode.RESOURCE_EXHAUSTED,
}


def cert_to_pb(c: Certificado) -> pb.Certificado:
    return pb.Certificado(**c.to_dict())


def _manejar(fn):
    def wrapper(self, request, context):
        try:
            return fn(self, request, context)
        except CertificadosError as e:
            context.abort(CODIGOS.get(e.code, grpc.StatusCode.INTERNAL), e.message)
    return wrapper


class CertificadosServicer(pb_grpc.CertificadosServiceServicer):
    def __init__(self, svc: CertificadosService):
        self.svc = svc

    @_manejar
    def ObtenerExamen(self, request, context):
        ex = self.svc.obtener_examen(request.evento_id, request.usuario_id)
        return pb.Examen(
            evento_id=ex["evento_id"], nota_minima=ex["nota_minima"],
            preguntas=[pb.Pregunta(id=p["id"], enunciado=p["enunciado"],
                                   opciones=[pb.Opcion(**o) for o in p["opciones"]]) for p in ex["preguntas"]],
        )

    @_manejar
    def RendirExamen(self, request, context):
        resp = {r.pregunta_id: r.opcion_id for r in request.respuestas}
        i = self.svc.rendir_examen(request.usuario_id, request.evento_id, resp)
        return pb.ResultadoExamen(intento_id=i.id, aprobado=i.aprobado, nota=i.nota, correctas=i.correctas, total=i.total)

    @_manejar
    def GenerarCertificado(self, request, context):
        c = self.svc.generar_certificado(request.usuario_id, request.evento_id, request.nombre_estudiante,
                                         request.evento_titulo, request.curso_codigo, request.curso_nombre)
        return cert_to_pb(c)

    @_manejar
    def ListarCertificados(self, request, context):
        certs = self.svc.listar(request.usuario_id, request.curso_codigo, request.fecha_desde, request.fecha_hasta)
        return pb.ListaCertificados(certificados=[cert_to_pb(c) for c in certs])

    @_manejar
    def VerificarCertificado(self, request, context):
        valido, mensaje, cert = self.svc.verificar(request.codigo)
        return pb.VerificacionResponse(valido=valido, mensaje=mensaje,
                                       certificado=cert_to_pb(cert) if cert and valido else None)


def registrar(server: grpc.Server, svc: CertificadosService) -> None:
    pb_grpc.add_CertificadosServiceServicer_to_server(CertificadosServicer(svc), server)
