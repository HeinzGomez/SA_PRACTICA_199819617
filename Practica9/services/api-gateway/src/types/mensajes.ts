// HeinzGomez - Práctica 9: contrato de mensajes del bus (API Gateway <-> servicios).
//
//   petición : exchange academix.rpc (direct, durable) -> cola <servicio>.rpc,
//              routing key = operación, cuerpo = payload del servicio
//   respuesta: cola `replyTo` del Gateway con el mismo `correlationId`

export interface RespuestaExitosa<T> {
  ok: true;
  datos: T;
}

export interface RespuestaFallida {
  ok: false;
  error: { codigo: string; mensaje: string };
}

export type Respuesta<T> = RespuestaExitosa<T> | RespuestaFallida;
