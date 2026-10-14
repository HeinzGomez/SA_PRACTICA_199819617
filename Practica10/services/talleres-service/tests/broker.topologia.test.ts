// HeinzGomez - Práctica 9: pruebas de la topología durable de colas de Talleres
import type { Channel } from 'amqplib';
import {
  COLA_CUPOS, COLA_RPC, COLA_RPC_DLQ, EXCHANGE_EVENTOS, EXCHANGE_MUERTOS, EXCHANGE_RPC,
  declararColaCupos, declararColaRpc,
} from '../src/broker/topologia';
import { OPERACIONES } from '../src/types/mensajes';
import { RK_RESERVA_CONFIRMADA } from '../src/types/reserva';

const crearCanal = () => ({
  assertExchange: jest.fn(async (..._args: unknown[]) => undefined),
  assertQueue: jest.fn(async (..._args: unknown[]) => undefined),
  bindQueue: jest.fn(async (..._args: unknown[]) => undefined),
});

const comoCanal = (c: ReturnType<typeof crearCanal>) => c as unknown as Channel;

describe('declararColaRpc (cola RPC + DLQ)', () => {
  test('declara exchanges, colas y bindings del contrato', async () => {
    const canal = crearCanal();
    await declararColaRpc(comoCanal(canal));

    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_MUERTOS, 'fanout', { durable: true });
    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_RPC, 'direct', { durable: true });
    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_RPC_DLQ, { durable: true });
    expect(canal.bindQueue).toHaveBeenCalledWith(COLA_RPC_DLQ, EXCHANGE_MUERTOS, '');
    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_RPC, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGE_MUERTOS,
        'x-dead-letter-routing-key': COLA_RPC_DLQ,
      },
    });
    expect(canal.bindQueue).toHaveBeenCalledTimes(1 + Object.values(OPERACIONES).length);
    for (const operacion of Object.values(OPERACIONES)) {
      expect(canal.bindQueue).toHaveBeenCalledWith(COLA_RPC, EXCHANGE_RPC, operacion);
    }
    expect(COLA_RPC).toBe('talleres.rpc');
    expect(COLA_RPC_DLQ).toBe('talleres.rpc.dlq');
  });

  test('es idempotente: repetirla declara exactamente lo mismo', async () => {
    const canal = crearCanal();
    const serie = (m: jest.Mock) => m.mock.calls.map((c) => JSON.stringify(c));

    await declararColaRpc(comoCanal(canal));
    const primeraVuelta = {
      assertExchange: serie(canal.assertExchange),
      assertQueue: serie(canal.assertQueue),
      bindQueue: serie(canal.bindQueue),
    };

    await declararColaRpc(comoCanal(canal));
    const segundaVuelta = {
      assertExchange: serie(canal.assertExchange).slice(primeraVuelta.assertExchange.length),
      assertQueue: serie(canal.assertQueue).slice(primeraVuelta.assertQueue.length),
      bindQueue: serie(canal.bindQueue).slice(primeraVuelta.bindQueue.length),
    };

    expect(segundaVuelta).toEqual(primeraVuelta);
    expect(canal.assertQueue).toHaveBeenCalledTimes(primeraVuelta.assertQueue.length * 2);
  });
});

describe('declararColaCupos (eventos de dominio de Reservas)', () => {
  test('une academix.events con la cola de cupos por reserva.confirmada', async () => {
    const canal = crearCanal();
    await declararColaCupos(comoCanal(canal));

    expect(canal.assertExchange).toHaveBeenCalledTimes(1);
    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_EVENTOS, 'topic', { durable: true });
    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_CUPOS, { durable: true });
    expect(canal.bindQueue).toHaveBeenCalledWith(COLA_CUPOS, EXCHANGE_EVENTOS, RK_RESERVA_CONFIRMADA);
    expect(COLA_CUPOS).toBe('talleres.cupos');
    expect(RK_RESERVA_CONFIRMADA).toBe('reserva.confirmada');
  });

  test('la cola de cupos se declara SIN argumentos (compatibilidad con la versión previa)', async () => {
    const canal = crearCanal();
    await declararColaCupos(comoCanal(canal));
    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_CUPOS, { durable: true });
    expect(canal.assertQueue.mock.calls[0][1]).not.toHaveProperty('arguments');
  });
});
