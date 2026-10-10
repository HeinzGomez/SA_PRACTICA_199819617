// HeinzGomez - Práctica 9: errores de negocio del Servicio de Talleres
export type CodigoError = 'INVALID_ARGUMENT' | 'NOT_FOUND' | 'FAILED_PRECONDITION' | 'INTERNAL';

export class TalleresError extends Error {
  constructor(public readonly code: CodigoError, message: string) {
    super(message);
  }
}
