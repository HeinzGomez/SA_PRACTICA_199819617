// HeinzGomez - Práctica 7: handlers gRPC (contrato proto/talleres.proto)
import * as grpc from '@grpc/grpc-js';
import { TalleresError } from './domain';
import { TalleresService } from './talleres.service';

const CODIGOS: Record<TalleresError['code'], grpc.status> = {
  INVALID_ARGUMENT: grpc.status.INVALID_ARGUMENT,
  NOT_FOUND: grpc.status.NOT_FOUND,
  FAILED_PRECONDITION: grpc.status.FAILED_PRECONDITION,
};

export function toGrpcError(e: unknown): Partial<grpc.ServiceError> {
  if (e instanceof TalleresError) return { code: CODIGOS[e.code], details: e.message, message: e.message };
  return { code: grpc.status.INTERNAL, details: 'Error interno', message: 'Error interno' };
}

type Unary = (call: { request: any }, cb: grpc.sendUnaryData<any>) => void;
const envolver = (fn: (req: any) => Promise<any>): Unary => (call, cb) => {
  fn(call.request).then((r) => cb(null, r)).catch((e) => cb(toGrpcError(e) as grpc.ServiceError, null));
};

export function crearHandlers(svc: TalleresService): Record<string, Unary> {
  return {
    ListarEventos: envolver(async (r) => ({ eventos: await svc.listar(r) })),
    ObtenerEvento: envolver((r) => svc.obtener(r.id)),
    ObtenerCupos: envolver(async (r) => ({ cupos: await svc.cupos(r.evento_ids ?? []) })),
    CrearEvento: envolver((r) => svc.crear(r)),
    ActualizarEvento: envolver((r) => svc.actualizar(r)),
    EliminarEvento: envolver(async (r) => ({ eliminado: await svc.eliminar(r.id) })),
  };
}
