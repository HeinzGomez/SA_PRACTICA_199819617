// HeinzGomez - Práctica 7: handlers gRPC (contrato proto/auth.proto)
import * as grpc from '@grpc/grpc-js';
import { AuthError, AuthService } from './auth.service';

const CODIGOS: Record<AuthError['code'], grpc.status> = {
  INVALID_ARGUMENT: grpc.status.INVALID_ARGUMENT,
  ALREADY_EXISTS: grpc.status.ALREADY_EXISTS,
  UNAUTHENTICATED: grpc.status.UNAUTHENTICATED,
};

export function toGrpcError(e: unknown): Partial<grpc.ServiceError> {
  if (e instanceof AuthError) return { code: CODIGOS[e.code], details: e.message, message: e.message };
  return { code: grpc.status.INTERNAL, details: 'Error interno', message: 'Error interno' };
}

type Unary = (call: { request: any }, cb: grpc.sendUnaryData<any>) => void;

const envolver = (fn: (req: any) => Promise<any>): Unary => (call, cb) => {
  fn(call.request).then((r) => cb(null, r)).catch((e) => cb(toGrpcError(e) as grpc.ServiceError, null));
};

export function crearHandlers(svc: AuthService): Record<string, Unary> {
  return {
    Register: envolver((r) => svc.register(r)),
    Login: envolver((r) => svc.login(r.correo, r.password)),
    ValidateToken: envolver((r) => svc.validateToken(r.token)),
  };
}
