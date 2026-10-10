// HeinzGomez - Práctica 9: pruebas de la conexión a RabbitMQ (reconexión automática)
import amqp from 'amqplib';

jest.mock('amqplib');

import { ConexionBroker } from '../src/broker/conexion';

type Maniobras = {
  on: jest.Mock;
  emitir: (evento: string, ...args: unknown[]) => void;
  close: jest.Mock;
  createChannel: jest.Mock;
  createConfirmChannel: jest.Mock;
};

const crearManiobras = (): Maniobras => {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  const canal = { on: jest.fn(), close: jest.fn().mockResolvedValue(undefined) };
  return {
    on: jest.fn((evento: string, cb: (...a: unknown[]) => void) => {
      (handlers[evento] ??= []).push(cb);
    }),
    emitir: (evento, ...args) => (handlers[evento] ?? []).forEach((cb) => cb(...args)),
    close: jest.fn().mockResolvedValue(undefined),
    createChannel: jest.fn(async () => canal),
    createConfirmChannel: jest.fn(async () => canal),
  };
};

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let connect: jest.Mock;
let avisos: jest.SpyInstance;
let logs: jest.SpyInstance;

beforeEach(() => {
  avisos = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  logs = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  connect = amqp.connect as unknown as jest.Mock;
  connect.mockReset();
});

afterEach(() => {
  avisos.mockRestore();
  logs.mockRestore();
});

describe('ConexionBroker', () => {
  test('sin conectar no deja abrir canales', async () => {
    const conexion = new ConexionBroker('amqp://x');
    await expect(conexion.canal()).rejects.toThrow('sin conexión con RabbitMQ');
    await expect(conexion.canalConfirmado()).rejects.toThrow('sin conexión con RabbitMQ');
  });

  test('conectar abre una sola conexión y registra sus manejadores', async () => {
    const m = crearManiobras();
    connect.mockResolvedValue(m);
    const conexion = new ConexionBroker('amqp://x');

    await conexion.conectar();
    await conexion.conectar(); // segunda vez: ya conectado, no reconecta

    expect(connect).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledWith('amqp://x');
    expect(m.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(m.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(await conexion.canal()).toBeDefined();

    connect.mockClear();
    m.createChannel.mockClear();
    await conexion.canal();
    expect(m.createChannel).toHaveBeenCalledTimes(1);
    expect(connect).not.toHaveBeenCalled();
  });

  test('canalConfirmado usa createConfirmChannel', async () => {
    const m = crearManiobras();
    connect.mockResolvedValue(m);
    const conexion = new ConexionBroker('amqp://x');
    await conexion.conectar();

    expect(await conexion.canalConfirmado()).toBeDefined();
    expect(m.createConfirmChannel).toHaveBeenCalledTimes(1);
    expect(m.createChannel).not.toHaveBeenCalled();
  });

  test('conectarConReintentos aguanta hasta que el broker responda', async () => {
    connect
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(crearManiobras());

    const conexion = new ConexionBroker('amqp://y', 1);
    await conexion.conectarConReintentos();

    expect(connect).toHaveBeenCalledTimes(3);
    expect(avisos).toHaveBeenCalledTimes(2);
    expect(logs).toHaveBeenCalledWith('[broker] conectado a RabbitMQ');
  });

  test('conectarConReintentos se rinde si se pide cerrar mientras reintenta', async () => {
    connect.mockRejectedValue(new Error('sigue caído'));
    const conexion = new ConexionBroker('amqp://z', 1);

    const promesa = conexion.conectarConReintentos();
    await dormir(10);
    await conexion.cerrar();
    await promesa;

    expect(connect).toHaveBeenCalled();
    expect(avisos).toHaveBeenCalled();
    await expect(conexion.canal()).rejects.toThrow('broker cerrado');
  });

  test('cerrar es idempotente y desconecta', async () => {
    const m = crearManiobras();
    connect.mockResolvedValue(m);
    const conexion = new ConexionBroker('amqp://w');
    await conexion.conectar();

    await conexion.cerrar();
    await conexion.cerrar();

    expect(m.close).toHaveBeenCalledTimes(1);
    await expect(conexion.canal()).rejects.toThrow('broker cerrado');
    await conexion.conectar(); // ya cerrada: no vuelve a conectar
    expect(connect).toHaveBeenCalledTimes(1);
  });

  test('si se pierde la conexión vuelve a reconectar sola', async () => {
    const primera = crearManiobras();
    const segunda = crearManiobras();
    connect.mockResolvedValueOnce(primera).mockResolvedValueOnce(segunda);

    const conexion = new ConexionBroker('amqp://v', 1);
    await conexion.conectar();

    primera.emitir('close');
    await dormir(15);

    expect(connect).toHaveBeenCalledTimes(2);
    expect(avisos).toHaveBeenCalledWith('[broker] conexión perdida; reconectando…');
    expect(await conexion.canal()).toBeDefined();

    await conexion.cerrar();
  });

  test('cerrar mientras se reconecta corta el bucle de reintentos', async () => {
    const primera = crearManiobras();
    connect.mockResolvedValueOnce(primera).mockRejectedValue(new Error('nadie'));

    const conexion = new ConexionBroker('amqp://u', 1);
    await conexion.conectar();

    primera.emitir('close');
    await dormir(5);
    await conexion.cerrar();
    await dormir(15);

    expect(avisos).toHaveBeenCalledWith('[broker] conexión perdida; reconectando…');
    await expect(conexion.canal()).rejects.toThrow('broker cerrado');
  });
});
