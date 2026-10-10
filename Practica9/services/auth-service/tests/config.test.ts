// HeinzGomez - Práctica 9: pruebas de la capa de configuración (entorno, pool, broker, reintentos)
import amqp from 'amqplib';

jest.mock('amqplib');
jest.mock('pg');

import { leerEntorno, Entorno } from '../src/config/entorno';
import { crearConfiguracionAuth, cerrarBroker, cerrarPool, obtenerConexionBroker, obtenerPool } from '../src/config';
import { iniciarConexionBroker } from '../src/config/broker';
import { dormir, reintentar } from '../src/config/reintentar';

const conectarComoJefe = () => {
  (amqp.connect as unknown as jest.Mock).mockResolvedValue({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  });
};

let avisos: jest.SpyInstance;
let errores: jest.SpyInstance;
let logs: jest.SpyInstance;

beforeEach(() => {
  avisos = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  errores = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  logs = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  conectarComoJefe();
});

afterEach(async () => {
  await cerrarBroker();
  await cerrarPool();
  avisos.mockRestore();
  errores.mockRestore();
  logs.mockRestore();
});

describe('leerEntorno', () => {
  test('usa los valores por defecto cuando no hay variables', () => {
    const e = leerEntorno({});
    expect(e).toMatchObject({
      databaseUrl: 'postgres://academix:academix@localhost:5432/auth_db',
      rabbitmqUrl: 'amqp://guest:guest@localhost:5672/',
      jwtSecret: 'dev-secret-cambiar',
      jwtExpiresIn: '2h',
      adminCorreo: 'admin@ingenieria.usac.edu.gt',
      brokerPrefetch: 20,
      bcryptRounds: 10,
    });
    expect(e.dominiosPermitidos).toEqual(['ingenieria.usac.edu.gt', 'usac.edu.gt']);
  });

  test('lee las variables del proceso y parsea números y listas', () => {
    const e = leerEntorno({
      DATABASE_URL: 'postgres://x/y',
      RABBITMQ_URL: 'amqp://u:p@broker/',
      BROKER_PREFETCH: '5',
      BCRYPT_ROUNDS: '4',
      JWT_SECRET: 's3cret',
      JWT_EXPIRES_IN: '30m',
      ALLOWED_EMAIL_DOMAINS: ' a.com ,, b.com ,',
      ADMIN_EMAIL: 'root@usac.edu.gt',
      ADMIN_PASSWORD: 'Otra1234',
    });
    expect(e).toEqual({
      databaseUrl: 'postgres://x/y',
      rabbitmqUrl: 'amqp://u:p@broker/',
      brokerPrefetch: 5,
      jwtSecret: 's3cret',
      jwtExpiresIn: '30m',
      dominiosPermitidos: ['a.com', 'b.com'],
      bcryptRounds: 4,
      adminCorreo: 'root@usac.edu.gt',
      adminPassword: 'Otra1234',
    });
  });
});

describe('crearConfiguracionAuth', () => {
  test('proyecta solo lo que necesita el servicio de autenticación', () => {
    const entorno = leerEntorno({ JWT_SECRET: 'abc', JWT_EXPIRES_IN: '10m', BCRYPT_ROUNDS: '6' });
    expect(crearConfiguracionAuth(entorno)).toEqual({
      jwtSecret: 'abc',
      jwtExpiresIn: '10m',
      dominiosPermitidos: ['ingenieria.usac.edu.gt', 'usac.edu.gt'],
      bcryptRounds: 6,
    });
  });
});

describe('piscina de PostgreSQL', () => {
  test('es un singleton y se puede cerrar más de una vez', () => {
    const entorno: Entorno = { ...leerEntorno({}), databaseUrl: 'postgres://falsa/base' };
    const primera = obtenerPool(entorno);
    expect(obtenerPool(entorno)).toBe(primera);
    expect(obtenerPool({ ...entorno, databaseUrl: 'otra' })).toBe(primera);
  });

  test('cerrarPool libera la piscina y permite volver a abrirla', async () => {
    const entorno = leerEntorno({});
    const primero = obtenerPool(entorno);
    await cerrarPool();
    await cerrarPool(); // segunda vez no debe reventar

    const segundo = obtenerPool(entorno);
    expect(segundo).not.toBe(primero);
    expect((primero.end as jest.Mock)).toHaveBeenCalled();
  });
});

describe('conexión al broker', () => {
  test('obtenerConexionBroker devuelve siempre la misma instancia', () => {
    const e = leerEntorno({});
    expect(obtenerConexionBroker(e)).toBe(obtenerConexionBroker(e));
  });

  test('iniciarConexionBroker conecta en segundo plano y cierra limpio', async () => {
    const broker = iniciarConexionBroker(leerEntorno({}));
    await dormir(5);
    expect(amqp.connect).toHaveBeenCalledWith('amqp://guest:guest@localhost:5672/');

    await cerrarBroker();
    expect(broker).toBeDefined();
    expect(avisos).not.toHaveBeenCalledWith(expect.stringContaining('no disponible'));
  });
});

describe('reintentar y dormir', () => {
  test('devuelve el resultado al primer intento', async () => {
    await expect(reintentar('demo', async () => 42)).resolves.toBe(42);
  });

  test('reintenta hasta que la dependencia responda', async () => {
    let intentos = 0;
    const valor = await reintentar('demo', async () => {
      intentos += 1;
      if (intentos < 3) throw new Error('todavía no');
      return 'listo';
    }, 5, 0);
    expect(valor).toBe('listo');
    expect(intentos).toBe(3);
    expect(avisos).toHaveBeenCalledTimes(2);
  });

  test('lanza un error claro cuando se agotan los intentos', async () => {
    await expect(
      reintentar('postgres', async () => { throw new Error('connection refused'); }, 3, 0),
    ).rejects.toThrow('postgres no disponible: connection refused');
    expect(avisos).toHaveBeenCalledTimes(3);
  });

  test('el error del intento final conserva el mensaje original', async () => {
    await expect(
      reintentar('rabbit', async () => { throw 500 as unknown as Error; }, 1, 0),
    ).rejects.toThrow('rabbit no disponible: error desconocido');
  });

  test('dormir espera el tiempo indicado', async () => {
    const inicio = Date.now();
    await dormir(15);
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(10);
  });
});
