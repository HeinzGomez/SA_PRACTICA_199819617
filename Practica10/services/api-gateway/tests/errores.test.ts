// HeinzGomez - Práctica 9: pruebas del error con código del contrato RPC.
import { ErrorRpc, HTTP_DE_ERROR } from '../src/types';

describe('types/errores', () => {
  test('ErrorRpc es un Error con código legible por la capa HTTP', () => {
    const e = new ErrorRpc('NOT_FOUND', 'El recurso no existe');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(ErrorRpc);
    expect(e.name).toBe('ErrorRpc');
    expect(e.code).toBe('NOT_FOUND');
    expect(e.message).toBe('El recurso no existe');
    expect(e.stack).toBeDefined();
  });

  test('la traducción código -> HTTP cubre el contrato completo', () => {
    expect(HTTP_DE_ERROR).toEqual({
      INVALID_ARGUMENT: 400,
      UNAUTHENTICATED: 401,
      PERMISSION_DENIED: 403,
      NOT_FOUND: 404,
      ALREADY_EXISTS: 409,
      FAILED_PRECONDITION: 409,
      RESOURCE_EXHAUSTED: 429,
      UNAVAILABLE: 503,
      INTERNAL: 500,
    });
  });

  test('un código desconocido no está en la tabla de traducción', () => {
    expect(HTTP_DE_ERROR['NO_EXISTE']).toBeUndefined();
    expect(HTTP_DE_ERROR[String(new ErrorRpc('X', 'y').code)]).toBeUndefined();
  });
});
