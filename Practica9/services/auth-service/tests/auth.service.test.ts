// HeinzGomez - Práctica 7: pruebas unitarias del Servicio de Autenticación (Jest)
import * as grpc from '@grpc/grpc-js';
import { AuthError, AuthService, InMemoryUsuarioRepository, publico } from '../src/auth.service';
import { crearHandlers, toGrpcError } from '../src/grpc-handlers';

const cfg = { jwtSecret: 'test', jwtExpiresIn: '1h', dominiosPermitidos: ['ingenieria.usac.edu.gt'], bcryptRounds: 4 };
const valido = { nombre: 'Heinz Gómez', carnet: '202010044', correo: 'Heinz@Ingenieria.usac.edu.gt', password: 'Segura123' };

describe('AuthService', () => {
  let repo: InMemoryUsuarioRepository;
  let svc: AuthService;
  beforeEach(() => {
    repo = new InMemoryUsuarioRepository();
    svc = new AuthService(repo, cfg);
  });

  test('CDU 1.2: registra estudiante, normaliza correo y no expone el hash', async () => {
    const r = await svc.register(valido);
    expect(r.token).toBeTruthy();
    expect(r.usuario.correo).toBe('heinz@ingenieria.usac.edu.gt');
    expect(r.usuario.rol).toBe('ESTUDIANTE');
    expect((r.usuario as any).passwordHash).toBeUndefined();
    const guardado = await repo.buscarPorCorreo('heinz@ingenieria.usac.edu.gt');
    expect(guardado?.passwordHash).not.toBe(valido.password);
  });

  test('CDU 1.2 excepción: datos inválidos devuelven todos los errores', async () => {
    const errores = svc.validarRegistro({ nombre: 'A', carnet: '12', correo: 'x@gmail.com', password: 'corta' });
    expect(errores).toHaveLength(4);
    await expect(svc.register({ ...valido, correo: 'no-es-correo' })).rejects.toMatchObject({ code: 'INVALID_ARGUMENT' });
  });

  test('CDU 1.2 excepción: correo duplicado', async () => {
    await svc.register(valido);
    await expect(svc.register(valido)).rejects.toMatchObject({ code: 'ALREADY_EXISTS' });
  });

  test('CDU 1.3: login correcto y token válido', async () => {
    await svc.register(valido);
    const { token, usuario } = await svc.login('HEINZ@ingenieria.usac.edu.gt', 'Segura123');
    const v = await svc.validateToken(token);
    expect(v.valido).toBe(true);
    expect(v.usuario?.id).toBe(usuario.id);
  });

  test('CDU 1.3 excepción: credenciales incorrectas con mensaje genérico', async () => {
    await svc.register(valido);
    await expect(svc.login(valido.correo, 'Mala12345')).rejects.toThrow('Credenciales incorrectas');
    await expect(svc.login('nadie@ingenieria.usac.edu.gt', 'x')).rejects.toThrow('Credenciales incorrectas');
  });

  test('validateToken rechaza tokens alterados o de usuarios inexistentes', async () => {
    expect((await svc.validateToken('basura')).valido).toBe(false);
    const { token } = await svc.register(valido);
    const otro = new AuthService(new InMemoryUsuarioRepository(), cfg);
    expect((await otro.validateToken(token)).valido).toBe(false);
  });

  test('publico() elimina el hash', () => {
    const u = publico({ id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR', passwordHash: 'h' });
    expect(u).toEqual({ id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR' });
  });
});

describe('grpc-handlers', () => {
  test('mapea AuthError a códigos gRPC', () => {
    expect(toGrpcError(new AuthError('UNAUTHENTICATED', 'x')).code).toBe(grpc.status.UNAUTHENTICATED);
    expect(toGrpcError(new AuthError('ALREADY_EXISTS', 'x')).code).toBe(grpc.status.ALREADY_EXISTS);
    expect(toGrpcError(new Error('boom')).code).toBe(grpc.status.INTERNAL);
  });

  test('Register/Login/ValidateToken responden por callback', async () => {
    const h = crearHandlers(new AuthService(new InMemoryUsuarioRepository(), cfg));
    const llamar = (m: string, request: any) =>
      new Promise<{ err: any; res: any }>((resolve) => h[m]({ request }, (err, res) => resolve({ err, res })));
    const reg = await llamar('Register', valido);
    expect(reg.err).toBeNull();
    const log = await llamar('Login', { correo: valido.correo, password: valido.password });
    expect(log.res.token).toBeTruthy();
    const bad = await llamar('Login', { correo: valido.correo, password: 'no' });
    expect(bad.err.code).toBe(grpc.status.UNAUTHENTICATED);
    const val = await llamar('ValidateToken', { token: log.res.token });
    expect(val.res.valido).toBe(true);
  });
});
