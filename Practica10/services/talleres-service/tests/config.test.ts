// HeinzGomez - Práctica 10: pruebas de la capa de configuración (env, pool, Redis, broker, reintentos)
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
    connect: jest.fn(),
    end: jest.fn(async () => undefined),
  })),
}));

jest.mock('ioredis', () =>
  jest.fn(() => ({
    ping: jest.fn(async () => 'PONG'),
    quit: jest.fn(async () => 'OK'),
    set: jest.fn(),
    mget: jest.fn(async () => []),
    del: jest.fn(),
    incrby: jest.fn(),
  })),
);

jest.mock('amqplib', () => ({
  connect: jest.fn(async () => ({
    on: jest.fn(),
    close: jest.fn(async () => undefined),
    createChannel: jest.fn(),
    createConfirmChannel: jest.fn(),
  })),
}));

import { espiarLogger } from './pistas';

type EntornoMod = typeof import('../src/config/entorno');
type BaseDatosMod = typeof import('../src/config/base-datos');
type CacheMod = typeof import('../src/config/cache');
type BrokerMod = typeof import('../src/config/broker');
type ReintentarMod = typeof import('../src/config/reintentar');
type IndexMod = typeof import('../src/config/index');
type LoggerMod = typeof import('../src/observabilidad/logger');

/** Los singletons viven a nivel de módulo: resetear el registro da una instancia limpia por prueba. */
const cargar = () => {
  jest.resetModules();
  return {
    entorno: require('../src/config/entorno') as EntornoMod,
    baseDatos: require('../src/config/base-datos') as BaseDatosMod,
    cache: require('../src/config/cache') as CacheMod,
    broker: require('../src/config/broker') as BrokerMod,
    reintentar: require('../src/config/reintentar') as ReintentarMod,
    index: require('../src/config/index') as IndexMod,
    logger: require('../src/observabilidad/logger') as LoggerMod,
  };
};

describe('leerEntorno', () => {
  test('usa los valores por defecto cuando el entorno está vacío', () => {
    const e = cargar().entorno.leerEntorno({});
    expect(e.databaseUrl).toContain('localhost:5432/talleres_db');
    expect(e.redisUrl).toBe('redis://localhost:6379');
    expect(e.rabbitmqUrl).toContain('amqp://');
    expect(e.rpcPrefetch).toBe(20);
    expect(e.cuposPrefetch).toBe(50);
    expect(e.puerto).toBe(8092);
    expect(e.logLevel).toBe('info');
  });

  test('respeta las variables definidas y convierte los números', () => {
    const { entorno } = cargar();
    expect(entorno.leerEntorno({
      DATABASE_URL: 'postgres://x/y',
      REDIS_URL: 'redis://cache:6379',
      RABBITMQ_URL: 'amqp://mq:5672',
      RPC_PREFETCH: '7',
      CUPOS_PREFETCH: '13',
      PUERTO: '9000',
      LOG_LEVEL: 'debug',
    })).toEqual({
      databaseUrl: 'postgres://x/y',
      redisUrl: 'redis://cache:6379',
      rabbitmqUrl: 'amqp://mq:5672',
      rpcPrefetch: 7,
      cuposPrefetch: 13,
      puerto: 9000,
      logLevel: 'debug',
    });
  });
});

describe('reintentar / dormir', () => {
  test('devuelve el valor en cuanto la operación funciona', async () => {
    const { reintentar } = cargar();
    const fn = jest.fn(async () => 'listo');
    await expect(reintentar.reintentar('postgres', fn, 3, 1)).resolves.toBe('listo');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('reintenta y relanza un error claro al agotar los intentos', async () => {
    const { reintentar, logger } = cargar();
    const avisos = espiarLogger(logger.loggerPorDefecto()).warn;
    const fn = jest.fn(async () => { throw new Error('nada'); });

    await expect(reintentar.reintentar('redis', fn, 3, 1)).rejects.toThrow('redis no disponible: nada');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(avisos).toHaveBeenCalledTimes(3); // avisa en cada intento; solo no duerme en el último
    expect(avisos).toHaveBeenCalledWith('[redis] intento 1/3 fallido: nada');
  });

  test('si el error no es Error igual se reporta', async () => {
    const { reintentar } = cargar();
    const fn = jest.fn(async () => { throw 'rotura'; });
    // un valor que no es Error no tiene .message: se reporta como "error desconocido"
    await expect(reintentar.reintentar('x', fn, 1, 1)).rejects.toThrow('x no disponible: error desconocido');
  });

  test('dormir espera el tiempo indicado', async () => {
    const { reintentar } = cargar();
    const inicio = Date.now();
    await reintentar.dormir(15);
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(10);
  });
});

describe('singletons de infraestructura', () => {
  test('el pool de Postgres se crea una vez y se cierra una vez', async () => {
    const { baseDatos, entorno } = cargar();
    const cfg = entorno.leerEntorno({});

    const a = baseDatos.obtenerPool(cfg);
    expect(baseDatos.obtenerPool(cfg)).toBe(a);

    await baseDatos.cerrarPool();
    await baseDatos.cerrarPool(); // idempotente
    expect(a.end).toHaveBeenCalledTimes(1);
    await expect(baseDatos.cerrarPool()).resolves.toBeUndefined();
  });

  test('el cliente Redis se crea una vez y se cierra aunque falle', async () => {
    const { cache, entorno } = cargar();
    const cfg = entorno.leerEntorno({});

    const a = cache.obtenerRedis(cfg);
    expect(cache.obtenerRedis(cfg)).toBe(a);

    await cache.cerrarRedis();
    await cache.cerrarRedis();
    expect(a.quit).toHaveBeenCalledTimes(1);

    const otro = cargar();
    const d = otro.cache.obtenerRedis(otro.entorno.leerEntorno({}));
    (d.quit as unknown as jest.Mock).mockRejectedValueOnce(new Error('conexión ya cerrada'));
    await expect(otro.cache.cerrarRedis()).resolves.toBeUndefined();
  });

  test('la conexión al broker se reutiliza y cierra limpia', async () => {
    const { broker, entorno } = cargar();
    const cfg = entorno.leerEntorno({});

    const a = broker.obtenerConexionBroker(cfg);
    expect(broker.obtenerConexionBroker(cfg)).toBe(a);
    await expect(a.canal()).rejects.toThrow('sin conexión con RabbitMQ');

    await broker.cerrarBroker();
    await broker.cerrarBroker(); // sin conexión: no hace nada
    await expect(a.canal()).rejects.toThrow('broker cerrado');
  });

  test('iniciarConexionBroker dispara la conexión en segundo plano', async () => {
    const { broker, entorno, logger } = cargar();
    const logs = espiarLogger(logger.loggerPorDefecto()).info;

    const conexion = broker.iniciarConexionBroker(entorno.leerEntorno({}));
    await new Promise((r) => setTimeout(r, 20));

    expect(conexion).toBeDefined();
    expect(logs).toHaveBeenCalledWith('[broker] conectado a RabbitMQ');

    await broker.cerrarBroker();
  });

  test('iniciarConexionBroker reenvía el estado al callback (gauge y readiness)', async () => {
    const { broker, entorno } = cargar();
    const estados: boolean[] = [];

    const conexion = broker.iniciarConexionBroker(entorno.leerEntorno({}), (c) => estados.push(c));
    await new Promise((r) => setTimeout(r, 20));

    expect(conexion.estaConectado()).toBe(true);
    expect(estados).toEqual([true]);

    await broker.cerrarBroker();
  });
});

describe('sondas de readiness', () => {
  test('verificarPool sondea con SELECT 1 para el readiness', async () => {
    const { baseDatos, entorno } = cargar();
    const cfg = entorno.leerEntorno({});
    await expect(baseDatos.verificarPool()).resolves.toBe(false); // sin piscina no hay nada que sondear

    const pool = baseDatos.obtenerPool(cfg);
    await expect(baseDatos.verificarPool()).resolves.toBe(true);

    (pool.query as unknown as jest.Mock).mockRejectedValueOnce(new Error('base caída'));
    await expect(baseDatos.verificarPool()).resolves.toBe(false);
  });

  test('verificarRedis sondea con PING para el readiness', async () => {
    const { cache, entorno } = cargar();
    const cfg = entorno.leerEntorno({});
    await expect(cache.verificarRedis()).resolves.toBe(false); // sin cliente no hay nada que sondear

    const redis = cache.obtenerRedis(cfg);
    await expect(cache.verificarRedis()).resolves.toBe(true);

    (redis.ping as unknown as jest.Mock).mockRejectedValueOnce(new Error('redis caído'));
    await expect(cache.verificarRedis()).resolves.toBe(false);
  });
});

describe('re-exportos del índice de configuración', () => {
  test('expone toda la fachada de configuración', () => {
    const { index } = cargar();
    expect(typeof index.leerEntorno).toBe('function');
    expect(typeof index.obtenerPool).toBe('function');
    expect(typeof index.cerrarPool).toBe('function');
    expect(typeof index.verificarPool).toBe('function');
    expect(typeof index.obtenerRedis).toBe('function');
    expect(typeof index.cerrarRedis).toBe('function');
    expect(typeof index.verificarRedis).toBe('function');
    expect(typeof index.obtenerConexionBroker).toBe('function');
    expect(typeof index.iniciarConexionBroker).toBe('function');
    expect(typeof index.cerrarBroker).toBe('function');
    expect(typeof index.reintentar).toBe('function');
    expect(typeof index.dormir).toBe('function');
  });
});
