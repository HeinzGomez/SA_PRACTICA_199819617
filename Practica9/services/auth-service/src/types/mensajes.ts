// HeinzGomez - Práctica 9: contrato de mensajes del bus (API Gateway <-> servicios).
//
//   petición : exchange academix.rpc (direct) -> cola <servicio>.rpc, routing key = operación
//              cuerpo JSON = mismo payload que tenía el contrato previo (proto)
//   respuesta: cola `replyTo` del solicitante con el mismo `correlationId`
import { CodigoError } from './errores';

/** Routing keys que este servicio consume (antes: métodos del contrato proto). */
export const OPERACIONES = {
  registro: 'auth.register',
  login: 'auth.login',
  validacion: 'auth.validate_token',
} as const;

export type Operacion = (typeof OPERACIONES)[keyof typeof OPERACIONES];

export interface RespuestaExitosa<T> {
  ok: true;
  datos: T;
}

export interface RespuestaFallida {
  ok: false;
  error: { codigo: CodigoError; mensaje: string };
}

export type Respuesta<T> = RespuestaExitosa<T> | RespuestaFallida;

export const exitosa = <T>(datos: T): RespuestaExitosa<T> => ({ ok: true, datos });

export const fallida = (codigo: CodigoError, mensaje: string): RespuestaFallida =>
  ({ ok: false, error: { codigo, mensaje } });

/** Mensaje ya parseado que llega al handler más los datos de la respuesta RPC. */
export interface Entrada {
  operacion: string;
  cuerpo: unknown;
  replyTo?: string;
  correlationId?: string;
  responder: (respuesta: Respuesta<unknown>) => Promise<void>;
}

export type Manejador = (entrada: Entrada) => Promise<void>;

export type Manejadores = Record<string, Manejador>;
