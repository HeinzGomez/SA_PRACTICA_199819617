import { ServiceError, status } from "@grpc/grpc-js";

export function buildError(error: unknown): ServiceError {
  const mensaje =
    error instanceof Error ? error.message : "Error interno del servidor";

  let code = status.INVALID_ARGUMENT;
  if (/ya existe|ya está en uso|ya tiene asignado/i.test(mensaje)) {
    code = status.ALREADY_EXISTS;
  }

  const grpcError = new Error(mensaje) as ServiceError;
  grpcError.code = code;
  grpcError.details = mensaje;
  return grpcError;
}
