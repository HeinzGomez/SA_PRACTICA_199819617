// HeinzGomez - Práctica 9: pruebas de los repositorios y del contador de cupos (Postgres / Redis / memoria)
import type { Pool } from 'pg';
import type Redis from 'ioredis';
import { PgEventoRepository } from '../src/repository/pg-evento.repository';
import { RedisCupoCache, cupoKey } from '../src/repository/redis-cupo.cache';
import { EnMemoriaEventoRepository } from '../src/repository/en-memoria-evento.repository';
import { EnMemoriaCupoCache } from '../src/repository/en-memoria-cupo.cache';
import { EVENTOS_SEED } from '../src/repository/seed';
import { Evento } from '../src/types/evento';

const fila = (e: Evento) => ({
  id: e.id, titulo: e.titulo, descripcion: e.descripcion, tipo: e.tipo,
  curso_codigo: e.curso_codigo, curso_nombre: e.curso_nombre,
  fecha_inicio: new Date(e.fecha_inicio), duracion_min: e.duracion_min,
  lugar: e.lugar, cupo_total: e.cupo_total, cupo_disponible: e.cupo_disponible,
  tiene_certificacion: e.tiene_certificacion,
  p_nombre: e.ponente.nombre, p_titulo: e.ponente.titulo, p_bio: e.ponente.bio, p_correo: e.ponente.correo,
  prerrequisitos: e.prerrequisitos,
});

type RespuestaPg = { rows: unknown[]; rowCount?: number | null };

const crearPool = () => {
  const cliente = {
    query: jest.fn(async (..._args: unknown[]): Promise<RespuestaPg> => ({ rows: [], rowCount: 0 })),
    release: jest.fn(),
  };
  const pool = {
    query: jest.fn(async (..._args: unknown[]): Promise<RespuestaPg> => ({ rows: [], rowCount: 0 })),
    connect: jest.fn(() => cliente),
  };
  return { pool: pool as unknown as Pool, consulta: pool.query, cliente };
};

describe('EnMemoriaEventoRepository', () => {
  test('aisla los datos: nadie puede mutar el mapa desde fuera', async () => {
    const repo = new EnMemoriaEventoRepository(EVENTOS_SEED);
    const todos = await repo.listar();
    expect(todos).toHaveLength(EVENTOS_SEED.length);
    todos[0].titulo = 'mutado';
    expect((await repo.obtener(EVENTOS_SEED[0].id))!.titulo).toBe(EVENTOS_SEED[0].titulo);

    const uno = (await repo.obtener(EVENTOS_SEED[1].id))!;
    uno.titulo = 'también mutado';
    expect((await repo.obtener(EVENTOS_SEED[1].id))!.titulo).toBe(EVENTOS_SEED[1].titulo);
  });

  test('guardar crea y actualiza; eliminar reporta si había algo', async () => {
    const repo = new EnMemoriaEventoRepository();
    expect(await repo.obtener('nuevo')).toBeNull();

    const e = { ...EVENTOS_SEED[0], id: 'nuevo' };
    await repo.guardar(e);
    expect((await repo.obtener('nuevo'))!.id).toBe('nuevo');

    await repo.actualizarCupoDisponible('nuevo', 5);
    expect((await repo.obtener('nuevo'))!.cupo_disponible).toBe(5);
    await repo.actualizarCupoDisponible('no-existe', 5); // sin efecto

    expect(await repo.eliminar('nuevo')).toBe(true);
    expect(await repo.eliminar('nuevo')).toBe(false);
  });
});

describe('EnMemoriaCupoCache', () => {
  test('inicializar no pisa un contador vivo', async () => {
    const cache = new EnMemoriaCupoCache();
    await cache.inicializar('e1', 10);
    await cache.inicializar('e1', 99);
    expect(cache.cupos.get('e1')).toBe(10);
  });

  test('ajustar, obtener y eliminar', async () => {
    const cache = new EnMemoriaCupoCache();
    await cache.ajustar('e1', 4);
    await cache.ajustar('e1', -2);
    expect(await cache.obtener(['e1', 'e2'])).toEqual(new Map([['e1', 2]]));
    await cache.eliminar('e1');
    expect(await cache.obtener(['e1'])).toEqual(new Map());
  });
});

describe('RedisCupoCache', () => {
  const crearRedis = () => {
    const redis = {
      set: jest.fn(async (..._args: unknown[]): Promise<string> => 'OK'),
      incrby: jest.fn(async (..._args: unknown[]): Promise<number> => 7),
      mget: jest.fn(async (..._args: unknown[]): Promise<(string | null)[]> => []),
      del: jest.fn(async (..._args: unknown[]): Promise<number> => 1),
    };
    return { redis: redis as unknown as Redis, ...redis };
  };

  test('inicializa con SET NX para no pisar el contador vivo', async () => {
    const { redis, set } = crearRedis();
    await new RedisCupoCache(redis).inicializar('evt-1', 30);
    expect(set).toHaveBeenCalledWith('cupo:evento:evt-1', 30, 'NX');
    expect(cupoKey('evt-1')).toBe('cupo:evento:evt-1');
  });

  test('ajustar delega en INCRBY (atómico con Reservas)', async () => {
    const { redis, incrby } = crearRedis();
    await expect(new RedisCupoCache(redis).ajustar('evt-1', -3)).resolves.toBe(7);
    expect(incrby).toHaveBeenCalledWith('cupo:evento:evt-1', -3);
  });

  test('obtener sin ids no toca Redis', async () => {
    const { redis, mget } = crearRedis();
    expect(await new RedisCupoCache(redis).obtener([])).toEqual(new Map());
    expect(mget).not.toHaveBeenCalled();
  });

  test('obtener ignora las claves que aún no existen', async () => {
    const { redis, mget } = crearRedis();
    mget.mockResolvedValueOnce(['12', null]);
    expect(await new RedisCupoCache(redis).obtener(['a', 'b']))
      .toEqual(new Map([['a', 12]]));
    expect(mget).toHaveBeenCalledWith(['cupo:evento:a', 'cupo:evento:b']);
  });

  test('eliminar borra la clave', async () => {
    const { redis, del } = crearRedis();
    await new RedisCupoCache(redis).eliminar('evt-1');
    expect(del).toHaveBeenCalledWith('cupo:evento:evt-1');
  });
});

describe('PgEventoRepository', () => {
  test('migrar no re-seedea si ya hay eventos', async () => {
    const { pool, consulta } = crearPool();
    consulta.mockResolvedValueOnce({ rows: [], rowCount: 0 }) // CREATE TABLE
      .mockResolvedValueOnce({ rows: [{ n: 3 }], rowCount: 1 });

    await expect(new PgEventoRepository(pool).migrar(EVENTOS_SEED)).resolves.toBe(false);
    expect(consulta).toHaveBeenCalledTimes(2);
  });

  test('migrar inserta el seed cuando la tabla está vacía', async () => {
    const { pool, consulta, cliente } = crearPool();
    consulta.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ n: 0 }], rowCount: 1 });
    cliente.query.mockResolvedValue({ rows: [{ id: 11 }], rowCount: 1 });

    await expect(new PgEventoRepository(pool).migrar([EVENTOS_SEED[0]])).resolves.toBe(true);
    expect(cliente.query).toHaveBeenCalledWith('BEGIN');
    expect(cliente.query).toHaveBeenCalledWith('COMMIT');
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test('listar mapea la fila plana al modelo de dominio', async () => {
    const { pool, consulta } = crearPool();
    consulta.mockResolvedValueOnce({
      rows: [fila(EVENTOS_SEED[0]), { ...fila(EVENTOS_SEED[1]), descripcion: null, prerrequisitos: null }],
      rowCount: 2,
    });

    const eventos = await new PgEventoRepository(pool).listar();
    expect(eventos).toHaveLength(2);
    expect(eventos[0].fecha_inicio).toBe(new Date(EVENTOS_SEED[0].fecha_inicio).toISOString());
    expect(eventos[1].descripcion).toBe('');
    expect(eventos[1].prerrequisitos).toEqual([]);
  });

  test('obtener devuelve null si la fila no existe', async () => {
    const { pool, consulta } = crearPool();
    consulta.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    expect(await new PgEventoRepository(pool).obtener('x')).toBeNull();

    consulta.mockResolvedValueOnce({ rows: [fila(EVENTOS_SEED[2])], rowCount: 1 });
    expect((await new PgEventoRepository(pool).obtener(EVENTOS_SEED[2].id))!.tipo).toBe('LABORATORIO');
  });

  test('guardar abre transacción, guarda ponente/evento/prerrequisitos y confirma', async () => {
    const { pool, cliente } = crearPool();
    cliente.query.mockResolvedValueOnce({ rows: [{ id: 11 }], rowCount: 1 }); // ponente
    cliente.query.mockResolvedValue({ rows: [{ id: 'x' }], rowCount: 1 });

    await new PgEventoRepository(pool).guardar({ ...EVENTOS_SEED[0], prerrequisitos: ['Docker', 'Docker', ''] });

    const sqls = cliente.query.mock.calls.map((c) => String(c[0]));
    expect(sqls[0]).toBe('BEGIN');
    expect(sqls[1]).toContain('INSERT INTO ponente');
    expect(sqls[2]).toContain('INSERT INTO evento');
    expect(sqls[3]).toContain('DELETE FROM evento_prerrequisito');
    expect(sqls.filter((s) => s.includes('INSERT INTO evento_prerrequisito'))).toHaveLength(1);
    expect(sqls.at(-1)).toBe('COMMIT');
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test('guardar revierte y propaga el error de la base de datos', async () => {
    const { pool, cliente } = crearPool();
    cliente.query.mockRejectedValueOnce(new Error('violación de llave'));

    await expect(new PgEventoRepository(pool).guardar(EVENTOS_SEED[0])).rejects.toThrow('violación de llave');
    const sqls = cliente.query.mock.calls.map((c) => String(c[0]));
    expect(sqls).toEqual(['BEGIN', 'ROLLBACK']);
    expect(cliente.release).toHaveBeenCalledTimes(1);
  });

  test('eliminar reporta si se borró alguna fila', async () => {
    const { pool, consulta } = crearPool();
    consulta.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    expect(await new PgEventoRepository(pool).eliminar('x')).toBe(true);

    consulta.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    expect(await new PgEventoRepository(pool).eliminar('x')).toBe(false);
  });

  test('actualizarCupoDisponible solo baja el cupo (tolerante a mensajes fuera de orden)', async () => {
    const { pool, consulta } = crearPool();
    await new PgEventoRepository(pool).actualizarCupoDisponible('evt-1', 4);
    expect(consulta).toHaveBeenCalledWith(expect.stringContaining('LEAST(cupo_disponible,$2)'), ['evt-1', 4]);
  });
});
