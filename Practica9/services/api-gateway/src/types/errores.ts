// HeinzGomez - Práctica 9: códigos de error del contrato RPC y su traducción a HTTP.
export type CodigoError =
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'FAILED_PRECONDITION'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_EXHAUSTED'
  | 'UNAUTHENTICATED'
  | 'UNAVAILABLE'
  | 'INTERNAL';

/** Código del bus -> estado HTTP que devuelve el API Gateway. */
export const HTTP_DE_ERROR: Record<string, number> = {
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  FAILED_PRECONDITION: 409,
  RESOURCE_EXHAUSTED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

/** Error con código legible por la capa HTTP; lo lanzan el broker y las rutas. */
export class ErrorRpc extends Error {
  constructor(readonly code: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorRpc';
  }
}
