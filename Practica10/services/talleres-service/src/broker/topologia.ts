// HeinzGomez - Práctica 9: topología durable de mensajes de Talleres.
//
//   (A) RPC con el API Gateway
//       exchange academix.rpc (direct, durable)
//         talleres.listar_eventos | talleres.obtener_evento | talleres.obtener_cupos |
//         talleres.crear_evento   | talleres.actualizar_evento | talleres.eliminar_evento
//             -> cola talleres.rpc (+ DLQ talleres.rpc.dlq vía academix.dlx.talleres)
//
//   (B) Eventos de dominio del Servicio de Reservas (cupos en tiempo real)
//       exchange academix.events (topic, durable)  [declarado también por reservas-service]
//         reserva.confirmada -> cola talleres.cupos
//
// El descuento real del cupo ocurre en reservas-service (script Lua atómico en Redis);
// aquí solo se persiste el valor absoluto que llega en `cupoRestante`.
import amqp from 'amqplib';
import { OPERACIONES } from '../types/mensajes';
import { RK_RESERVA_CONFIRMADA } from '../types/reserva';

export const EXCHANGE_RPC = 'academix.rpc';
export const EXCHANGE_EVENTOS = 'academix.events';
/** DLX propio: aísla las DLQ de este servicio de las de los demás. */
export const EXCHANGE_MUERTOS = 'academix.dlx.talleres';

export const COLA_RPC = 'talleres.rpc';
export const COLA_RPC_DLQ = 'talleres.rpc.dlq';
export const COLA_CUPOS = 'talleres.cupos';

/** Cola durable del RPC con la API Gateway (+ DLQ). Idempotente: se llama en cada canal nuevo. */
export async function declararColaRpc(canal: amqp.Channel): Promise<void> {
  await canal.assertExchange(EXCHANGE_MUERTOS, 'fanout', { durable: true });
  await canal.assertExchange(EXCHANGE_RPC, 'direct', { durable: true });
  await canal.assertQueue(COLA_RPC_DLQ, { durable: true });
  await canal.bindQueue(COLA_RPC_DLQ, EXCHANGE_MUERTOS, '');
  await canal.assertQueue(COLA_RPC, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': EXCHANGE_MUERTOS,
      'x-dead-letter-routing-key': COLA_RPC_DLQ,
    },
  });
  for (const operacion of Object.values(OPERACIONES)) {
    await canal.bindQueue(COLA_RPC, EXCHANGE_RPC, operacion);
  }
}

/**
 * Cola durable de `reserva.confirmada` (sincroniza cupo_disponible en Postgres).
 * Se declara EXACTAMENTE como la versión anterior (sin argumentos): si cambiara su
 * definición, RabbitMQ respondería PRECONDITION_FAILED y los cupos dejarían de sincronizarse.
 */
export async function declararColaCupos(canal: amqp.Channel): Promise<void> {
  await canal.assertExchange(EXCHANGE_EVENTOS, 'topic', { durable: true });
  await canal.assertQueue(COLA_CUPOS, { durable: true });
  await canal.bindQueue(COLA_CUPOS, EXCHANGE_EVENTOS, RK_RESERVA_CONFIRMADA);
}
