// HeinzGomez - Práctica 9: pruebas del productor de respuestas RPC (canal con confirmaciones)
import type amqp from 'amqplib';
import { Productor } from '../src/broker/productor';
import { ConexionBroker } from '../src/broker/conexion';
import { exitosa, fallida } from '../src/types/mensajes';

type CanalConfirmado = amqp.ConfirmChannel & { on: jest.Mock; close: jest.Mock; publish: jest.Mock };

const crearCanal = (): CanalConfirmado => {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  const canal = {
    on: jest.fn((evento: string, cb: () => void) => {
      (handlers[evento] ??= []).push(cb);
    }),
    close: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn(),
    disparar: (evento: string, ...args: unknown[]) =>
      (handlers[evento] ?? []).forEach((f) => f(...args)),
  };
  return canal as unknown as CanalConfirmado;
};

const confirmarTodo = (canal: CanalConfirmado): CanalConfirmado => {
  canal.publish.mockImplementation((_x: string, _c: string, _b: Buffer, _o: unknown, cb?: (e?: Error | null) => void) => {
    cb?.(null);
  });
  return canal;
};

let logs: jest.SpyInstance;
let avisos: jest.SpyInstance;
let errores: jest.SpyInstance;

beforeEach(() => {
  logs = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  avisos = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  errores = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  logs.mockRestore();
  avisos.mockRestore();
  errores.mockRestore();
});

const destino = { cola: 'gateway.reply', correlationId: 'c-9' };

describe('Productor', () => {
  test('publica la respuesta con las propiedades del contrato RPC', async () => {
    const canal = confirmarTodo(crearCanal());
    const productor = new Productor({ canalConfirmado: jest.fn(async () => canal) } as unknown as ConexionBroker);

    await productor.responder(destino, exitosa({ ok: 1 }));

    expect(canal.publish).toHaveBeenCalledTimes(1);
    const [exchange, cola, contenido, opciones] = canal.publish.mock.calls[0];
    expect(exchange).toBe('');
    expect(cola).toBe('gateway.reply');
    expect(JSON.parse(contenido.toString('utf8'))).toEqual({ ok: true, datos: { ok: 1 } });
    expect(opciones).toEqual({
      contentType: 'application/json',
      correlationId: 'c-9',
      persistent: true,
    });
  });

  test('serializa también las respuestas de error', async () => {
    const canal = confirmarTodo(crearCanal());
    const productor = new Productor({ canalConfirmado: jest.fn(async () => canal) } as unknown as ConexionBroker);

    await productor.responder({ cola: 'r' }, fallida('INTERNAL', 'algo salió mal'));

    const contenido = canal.publish.mock.calls[0][2] as Buffer;
    expect(JSON.parse(contenido.toString('utf8'))).toEqual({
      ok: false, error: { codigo: 'INTERNAL', mensaje: 'algo salió mal' },
    });
  });

  test('reutiliza el canal entre publicaciones', async () => {
    const canal = confirmarTodo(crearCanal());
    const abrir = jest.fn(async () => canal);
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await productor.responder(destino, exitosa(1));
    await productor.responder(destino, exitosa(2));

    expect(abrir).toHaveBeenCalledTimes(1);
    expect(canal.publish).toHaveBeenCalledTimes(2);
  });

  test('si el canal muere se abre otro en la siguiente publicación', async () => {
    const canal = confirmarTodo(crearCanal());
    const abrir = jest.fn(async () => canal);
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await productor.responder(destino, exitosa(1));
    (canal as unknown as { disparar: (e: string) => void }).disparar('close');
    await productor.responder(destino, exitosa(2));

    expect(abrir).toHaveBeenCalledTimes(2);
    expect(canal.publish).toHaveBeenCalledTimes(2);
  });

  test('varias publicaciones en paralelo comparten la misma apertura de canal', async () => {
    const canal = confirmarTodo(crearCanal());
    const abrir = jest.fn(async () => canal);
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await Promise.all([
      productor.responder(destino, exitosa(1)),
      productor.responder(destino, exitosa(2)),
      productor.responder(destino, exitosa(3)),
    ]);

    expect(abrir).toHaveBeenCalledTimes(1);
    expect(canal.publish).toHaveBeenCalledTimes(3);
  });

  test('si el broker rechaza la publicación reintenta y termina lanzando', async () => {
    const canal = crearCanal();
    canal.publish.mockImplementation((_x: string, _c: string, _b: Buffer, _o: unknown, cb?: (e?: Error | null) => void) => {
      cb?.(new Error('nack del broker'));
    });
    const abrir = jest.fn(async () => canal);
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await expect(productor.responder(destino, exitosa(1))).rejects.toThrow('nack del broker');
    expect(canal.publish).toHaveBeenCalledTimes(3);
    expect(abrir).toHaveBeenCalledTimes(3);
    expect(canal.close).toHaveBeenCalledTimes(3);
  });

  test('tras un fallo, la siguiente publicación vuelve a funcionar', async () => {
    const roto = crearCanal();
    roto.publish.mockImplementation((_x: string, _c: string, _b: Buffer, _o: unknown, cb?: (e?: Error | null) => void) => {
      cb?.(new Error('canal roto'));
    });
    const sano = confirmarTodo(crearCanal());
    let intentos = 0;
    const abrir = jest.fn(async () => {
      intentos += 1;
      return intentos <= 3 ? roto : sano;
    });
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await expect(productor.responder(destino, exitosa(1))).rejects.toThrow('canal roto');
    await expect(productor.responder(destino, exitosa(2))).resolves.toBeUndefined();

    expect(sano.publish).toHaveBeenCalledTimes(1);
  });

  test('si no se puede abrir canal se agotan los reintentos con el error original', async () => {
    const abrir = jest.fn(async () => { throw new Error('sin conexión con RabbitMQ'); });
    const productor = new Productor({ canalConfirmado: abrir } as unknown as ConexionBroker);

    await expect(productor.responder(destino, exitosa(1))).rejects.toThrow('sin conexión con RabbitMQ');
    expect(abrir).toHaveBeenCalledTimes(3);
  });

  test('la espera entre reintentos es corta pero existe', async () => {
    const canal = crearCanal();
    canal.publish.mockImplementation((_x: string, _c: string, _b: Buffer, _o: unknown, cb?: (e?: Error | null) => void) => {
      cb?.(new Error('fallo'));
    });
    const productor = new Productor({ canalConfirmado: jest.fn(async () => canal) } as unknown as ConexionBroker);

    const inicio = Date.now();
    await expect(productor.responder(destino, exitosa(1))).rejects.toThrow('fallo');
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(350);
  });

  test('el manejador de error de canal evita que el proceso se caiga', async () => {
    const canal = confirmarTodo(crearCanal());
    const productor = new Productor({ canalConfirmado: jest.fn(async () => canal) } as unknown as ConexionBroker);
    await productor.responder(destino, exitosa(1));

    const disparar = (canal as unknown as { disparar: (e: string, ...a: unknown[]) => void }).disparar;
    expect(() => disparar('error', new Error('socket caído'))).not.toThrow();
    expect(avisos).toHaveBeenCalledWith('[broker] error de canal de publicación: socket caído');
    expect(errores).not.toHaveBeenCalled();
  });
});