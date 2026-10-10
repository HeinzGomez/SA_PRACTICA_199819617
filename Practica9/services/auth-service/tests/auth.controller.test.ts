// HeinzGomez - Práctica 9: pruebas del controlador RPC (adaptador de entrada del servicio)
import { AuthController } from '../src/controller/auth.controller';
import { AuthService } from '../src/service/auth.service';
import { EnMemoriaUsuarioRepository } from '../src/repository/en-memoria-usuario.repository';
import { AuthError } from '../src/types/errores';
import { Entrada, Manejadores, OPERACIONES, Respuesta, exitosa, fallida } from '../src/types/mensajes';
import { ConfiguracionAuth, RegistroInput } from '../src/types/auth';

const cfg: ConfiguracionAuth = {
  jwtSecret: 'secreto-de-prueba',
  jwtExpiresIn: '1h',
  dominiosPermitidos: ['ingenieria.usac.edu.gt'],
  bcryptRounds: 4,
};

const valido: RegistroInput = {
  nombre: 'Heinz Gómez',
  carnet: '202010044',
  correo: 'heinz@ingenieria.usac.edu.gt',
  password: 'Segura123',
};

const crearManejadores = (servicio = new AuthService(new EnMemoriaUsuarioRepository(), cfg)): Manejadores =>
  new AuthController(servicio).manejadores();

/** Invoca un manejador como lo haría el consumidor y captura la respuesta RPC. */
const llamar = async (
  h: Manejadores,
  operacion: string,
  cuerpo: unknown,
  { replyTo = 'cola-de-prueba' }: { replyTo?: string | null } = {},
): Promise<{ respuesta?: Respuesta<unknown>; llamado: boolean }> => {
  let respuesta: Respuesta<unknown> | undefined;
  let llamado = false;
  const entrada: Entrada = {
    operacion,
    cuerpo,
    replyTo: replyTo ?? undefined,
    correlationId: 'c-1',
    responder: async (r) => { llamado = true; respuesta = r; },
  };
  await h[operacion]?.(entrada);
  return { respuesta, llamado };
};

describe('AuthController · contrato de operaciones', () => {
  test('expone exactamente las routing keys del contrato', () => {
    const h = crearManejadores();
    expect(Object.keys(h).sort()).toEqual(
      [OPERACIONES.login, OPERACIONES.registro, OPERACIONES.validacion].sort(),
    );
    expect(h['auth.operacion_inexistente']).toBeUndefined();
    expect(OPERACIONES).toEqual({
      registro: 'auth.register',
      login: 'auth.login',
      validacion: 'auth.validate_token',
    });
  });

  test('si no hay replyTo no se intenta responder', async () => {
    const h = crearManejadores();
    const { llamado, respuesta } = await llamar(h, OPERACIONES.registro, valido, { replyTo: null });
    expect(llamado).toBe(false);
    expect(respuesta).toBeUndefined();
  });
});

describe('AuthController · respuestas {ok:true,datos}', () => {
  test('registro, login y validación encadenados', async () => {
    const h = crearManejadores();

    const reg = (await llamar(h, OPERACIONES.registro, valido)).respuesta as any;
    expect(reg.ok).toBe(true);
    expect(reg.datos.usuario.correo).toBe('heinz@ingenieria.usac.edu.gt');
    expect(reg.datos.usuario).not.toHaveProperty('passwordHash');

    const log = (await llamar(h, OPERACIONES.login, { correo: valido.correo, password: valido.password })).respuesta as any;
    expect(log.ok).toBe(true);
    expect(log.datos.token).toBeTruthy();

    const val = (await llamar(h, OPERACIONES.validacion, { token: log.datos.token })).respuesta as any;
    expect(val).toMatchObject({ ok: true, datos: { valido: true } });
    expect(val.datos.usuario.id).toBe(reg.datos.usuario.id);
  });

  test('cuerpo null/undefined se trata como objeto vacío', async () => {
    const h = crearManejadores();
    const vacio = (await llamar(h, OPERACIONES.registro, null)).respuesta as any;
    expect(vacio).toMatchObject({ ok: false, error: { codigo: 'INVALID_ARGUMENT' } });

    const sinCuerpo = (await llamar(h, OPERACIONES.login, undefined)).respuesta as any;
    expect(sinCuerpo).toMatchObject({ ok: false, error: { codigo: 'UNAUTHENTICATED' } });

    const validacion = (await llamar(h, OPERACIONES.validacion, null)).respuesta as any;
    expect(validacion).toEqual({ ok: true, datos: { valido: false } });
  });
});

describe('AuthController · errores de negocio en el bus', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => { errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined); });
  afterEach(() => errorSpy.mockRestore());

  test('los errores de dominio viajan como {ok:false,error:{codigo,mensaje}}', async () => {
    const h = crearManejadores();
    await llamar(h, OPERACIONES.registro, valido);

    const mala = (await llamar(h, OPERACIONES.login, { correo: valido.correo, password: 'no' })).respuesta;
    expect(mala).toEqual({ ok: false, error: { codigo: 'UNAUTHENTICATED', mensaje: 'Credenciales incorrectas' } });

    const dup = (await llamar(h, OPERACIONES.registro, valido)).respuesta as any;
    expect(dup).toMatchObject({ ok: false, error: { codigo: 'ALREADY_EXISTS' } });

    const invalida = (await llamar(h, OPERACIONES.registro, {})).respuesta as any;
    expect(invalida).toMatchObject({ ok: false, error: { codigo: 'INVALID_ARGUMENT' } });

    const tokenMalo = (await llamar(h, OPERACIONES.validacion, { token: 'basura' })).respuesta;
    expect(tokenMalo).toEqual({ ok: true, datos: { valido: false } });
  });

  test('un fallo inesperado se mapea a INTERNAL y se registra en consola', async () => {
    const fallo = Object.assign(new Error('explosión'), { code: 'boom' });
    const servicio = {
      register: jest.fn(async () => { throw fallo; }),
      login: jest.fn(async () => { throw fallo; }),
      validateToken: jest.fn(async () => { throw fallo; }),
    } as unknown as AuthService;
    const h = new AuthController(servicio).manejadores();

    for (const operacion of [OPERACIONES.registro, OPERACIONES.login, OPERACIONES.validacion]) {
      const r = (await llamar(h, operacion, {})).respuesta;
      expect(r).toEqual({ ok: false, error: { codigo: 'INTERNAL', mensaje: 'Error interno' } });
    }
    expect(errorSpy).toHaveBeenCalledTimes(3);
    expect(errorSpy.mock.calls[0][1]).toBe(fallo);
  });

  test('AuthError conserva su código de dominio', () => {
    expect(new AuthError('UNAUTHENTICATED', 'x').code).toBe('UNAUTHENTICATED');
    expect(new AuthError('INVALID_ARGUMENT', 'y').message).toBe('y');
    expect(new Error('boom')).not.toBeInstanceOf(AuthError);
  });
});

describe('constructores del contrato de mensajes', () => {
  test('exitosa() y fallida() armian el envoltorio correcto', () => {
    expect(exitosa({ a: 1 })).toEqual({ ok: true, datos: { a: 1 } });
    expect(fallida('INTERNAL', 'm')).toEqual({ ok: false, error: { codigo: 'INTERNAL', mensaje: 'm' } });
  });
});
