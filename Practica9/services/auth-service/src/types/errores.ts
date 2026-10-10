// HeinzGomez - Práctica 9: errores de negocio y sus códigos de contrato
export type CodigoError = 'INVALID_ARGUMENT' | 'ALREADY_EXISTS' | 'UNAUTHENTICATED' | 'INTERNAL';

export class AuthError extends Error {
  constructor(public readonly code: CodigoError, message: string) {
    super(message);
  }
}
