// HeinzGomez - Práctica 9: pruebas de la topología durable del bus (exchange, colas y bindings)
import type amqp from 'amqplib';
import {
  COLA_AUTH, COLA_AUTH_DLQ, EXCHANGE_MUERTOS, EXCHANGE_RPC, declararTopologia,
} from '../src/broker/topologia';
import { OPERACIONES } from '../src/types/mensajes';

const crearCanal = () => ({
  assertExchange: jest.fn(async () => undefined),
  assertQueue: jest.fn(async () => undefined),
  bindQueue: jest.fn(async () => undefined),
});

const comoCanal = (c: ReturnType<typeof crearCanal>) => c as unknown as amqp.Channel;

describe('declararTopologia', () => {
  test('declara los exchanges durable', async () => {
    const canal = crearCanal();
    await declararTopologia(comoCanal(canal));

    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_MUERTOS, 'fanout', { durable: true });
    expect(canal.assertExchange).toHaveBeenCalledWith(EXCHANGE_RPC, 'direct', { durable: true });
    expect(EXCHANGE_RPC).toBe('academix.rpc');
    expect(EXCHANGE_MUERTOS).toBe('academix.dlx.auth');
  });

  test('la cola principal tiene su propia DLX y la DLQ queda enlazada', async () => {
    const canal = crearCanal();
    await declararTopologia(comoCanal(canal));

    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_AUTH_DLQ, { durable: true });
    expect(canal.bindQueue).toHaveBeenCalledWith(COLA_AUTH_DLQ, EXCHANGE_MUERTOS, '');
    expect(canal.assertQueue).toHaveBeenCalledWith(COLA_AUTH, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGE_MUERTOS,
        'x-dead-letter-routing-key': COLA_AUTH_DLQ,
      },
    });
    expect(COLA_AUTH).toBe('auth.rpc');
    expect(COLA_AUTH_DLQ).toBe('auth.rpc.dlq');
  });

  test('enlaza la cola con cada operación del contrato', async () => {
    const canal = crearCanal();
    await declararTopologia(comoCanal(canal));

    expect(canal.bindQueue).toHaveBeenCalledTimes(1 + Object.values(OPERACIONES).length);
    for (const operacion of Object.values(OPERACIONES)) {
      expect(canal.bindQueue).toHaveBeenCalledWith(COLA_AUTH, EXCHANGE_RPC, operacion);
    }
  });

  test('es idempotente: repetirla declara exactamente lo mismo', async () => {
    const canal = crearCanal();
    const serie = (m: jest.Mock) => m.mock.calls.map((c) => JSON.stringify(c));

    await declararTopologia(comoCanal(canal));
    const primeraVuelta = {
      assertExchange: serie(canal.assertExchange),
      assertQueue: serie(canal.assertQueue),
      bindQueue: serie(canal.bindQueue),
    };

    await declararTopologia(comoCanal(canal));
    const segundaVuelta = {
      assertExchange: serie(canal.assertExchange).slice(primeraVuelta.assertExchange.length),
      assertQueue: serie(canal.assertQueue).slice(primeraVuelta.assertQueue.length),
      bindQueue: serie(canal.bindQueue).slice(primeraVuelta.bindQueue.length),
    };

    expect(segundaVuelta).toEqual(primeraVuelta);
    expect(canal.assertQueue).toHaveBeenCalledTimes(primeraVuelta.assertQueue.length * 2);
    expect(canal.bindQueue).toHaveBeenCalledTimes(primeraVuelta.bindQueue.length * 2);
  });
});
