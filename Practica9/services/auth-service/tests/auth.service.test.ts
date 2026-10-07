// HeinzGomez - Práctica 9: pruebas unitarias del Servicio de Autenticación (Jest)
import { AuthError } from '../src/types/errores';
import { AuthService, publico } from '../src/service/auth.service';
import { EnMemoriaUsuarioRepository } from '../src/repository/en-memoria-usuario.repository';
import { AuthController } from '../src/controller/auth.controller';
import { Manejadores, OPERACIONES, Respuesta } from '../src/types/mensajes';

const cfg = { jwtSecret: 'test', jwtExpiresIn: '1h', dominiosPermitidos: ['ingenieria.usac.edu.gt'], bcryptRounds: 4 };
const valido = { nombre: 'Heinz Gómez', carnet: '202010044', correo: 'Heinz@Ingenieria.usac.edu.gt', password: 'Segura123' };

describe('AuthService', () => {
  let repo: EnMemoriaUsuarioRepository;
  let svc: AuthService;
  beforeEach(() => {
    repo = new EnMemoriaUsuarioRepository();
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
    const otro = new AuthService(new EnMemoriaUsuarioRepository(), cfg);
    expect((await otro.validateToken(token)).valido).toBe(false);
  });

  test('publico() elimina el hash', () => {
    const u = publico({ id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR', passwordHash: 'h' });
    expect(u).toEqual({ id: '1', nombre: 'n', carnet: 'c', correo: 'e', rol: 'ADMINISTRADOR' });
  });
});

describe('controlador RPC del bus de mensajes', () => {
  const crear = () => new AuthController(new AuthService(new EnMemoriaUsuarioRepository(), cfg)).manejadores();

  const llamar = async (h: Manejadores, operacion: string, cuerpo: unknown): Promise<any> => {
    let respuesta: Respuesta<any> | undefined;
    await h[operacion]({ operacion, cuerpo, replyTo: 'cola-de-prueba', responder: async (r) => { respuesta = r; } });
    return respuesta!;
  };

  test('expone exactamente las operaciones del contrato', () => {
    const h = crear();
    expect(Object.keys(h).sort()).toEqual([OPERACIONES.login, OPERACIONES.registro, OPERACIONES.validacion].sort());
    expect(h['auth.operacion_inexistente']).toBeUndefined();
  });

  test('registro, login y validación responden {ok:true,datos}', async () => {
    const h = crear();
    const reg = await llamar(h, OPERACIONES.registro, valido);
    expect(reg.ok).toBe(true);
    expect(reg.datos.usuario.correo).toBe('heinz@ingenieria.usac.edu.gt');

    const log = await llamar(h, OPERACIONES.login, { correo: valido.correo, password: valido.password });
    expect(log.ok).toBe(true);
    expect(log.datos.token).toBeTruthy();

    const val = await llamar(h, OPERACIONES.validacion, { token: log.datos.token });
    expect(val).toMatchObject({ ok: true, datos: { valido: true } });
    expect(val.datos.usuario.id).toBe(reg.datos.usuario.id);
  });

  test('los errores de negocio viajan como {ok:false,error:{codigo,mensaje}}', async () => {
    const h = crear();
    await llamar(h, OPERACIONES.registro, valido);

    const mala = await llamar(h, OPERACIONES.login, { correo: valido.correo, password: 'no' });
    expect(mala).toEqual({ ok: false, error: { codigo: 'UNAUTHENTICATED', mensaje: 'Credenciales incorrectas' } });

    const dup = await llamar(h, OPERACIONES.registro, valido);
    expect(dup).toMatchObject({ ok: false, error: { codigo: 'ALREADY_EXISTS' } });

    const invalida = await llamar(h, OPERACIONES.registro, {});
    expect(invalida).toMatchObject({ ok: false, error: { codigo: 'INVALID_ARGUMENT' } });

    const tokenMalo = await llamar(h, OPERACIONES.validacion, { token: 'basura' });
    expect(tokenMalo).toEqual({ ok: true, datos: { valido: false } });
  });

  test('AuthError conserva el código de dominio', () => {
    expect(new AuthError('UNAUTHENTICATED', 'x').code).toBe('UNAUTHENTICATED');
    expect(new Error('boom')).not.toBeInstanceOf(AuthError);
  });
});
