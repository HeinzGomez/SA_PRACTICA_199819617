// HeinzGomez - Práctica 9: topología durable del bus de mensajes del servicio.
//
//   exchange academix.rpc (direct, durable)
//     auth.register | auth.login | auth.validate_token -> cola auth.rpc
//   exchange academix.dlx.auth (fanout, durable) -> cola auth.rpc.dlq   (mensajes no confirmados)
//   DLX propio: no comparte DLQ con los demás servicios ni con reservas-service.
import amqp from 'amqplib';
import { OPERACIONES } from '../types/mensajes';

export const EXCHANGE_RPC = 'academix.rpc';
export const EXCHANGE_MUERTOS = 'academix.dlx.auth';
export const COLA_AUTH = 'auth.rpc';
export const COLA_AUTH_DLQ = 'auth.rpc.dlq';

/** Declara colas durables y bindings; idempotente, se invoca en cada canal nuevo. */
export async function declararTopologia(canal: amqp.Channel): Promise<void> {
  await canal.assertExchange(EXCHANGE_MUERTOS, 'fanout', { durable: true });
  await canal.assertExchange(EXCHANGE_RPC, 'direct', { durable: true });
  await canal.assertQueue(COLA_AUTH_DLQ, { durable: true });
  await canal.bindQueue(COLA_AUTH_DLQ, EXCHANGE_MUERTOS, '');
  await canal.assertQueue(COLA_AUTH, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_MUERTOS,
      'x-dead-letter-routing-key': COLA_AUTH_DLQ,
    },
  });
  for (const operacion of Object.values(OPERACIONES)) {
    await canal.bindQueue(COLA_AUTH, EXCHANGE_RPC, operacion);
  }
}
