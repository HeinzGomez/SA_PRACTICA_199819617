// HeinzGomez - Práctica 10: logging estructurado (JSON por stdout) con pino + pino-http.
import { randomUUID } from 'node:crypto';
import type { RequestHandler, Request, Response } from 'express';
import pino, { DestinationStream, Logger, LoggerOptions } from 'pino';
import type { Options } from 'pino-http';
import { pinoHttp } from 'pino-http';
import { esRutaInterna, rutaNormalizada } from './ruta';

const VERSION = process.env.SERVICE_VERSION ?? '1.0.0';

/** `LOG_LEVEL` por variable de entorno; silencioso bajo Jest para no ensuciar la salida de las pruebas. */
export function nivelPorDefecto(): string {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return 'silent';
  return process.env.LOG_LEVEL ?? 'info';
}

export function crearLogger(nivel: string = nivelPorDefecto(), destino?: DestinationStream): Logger {
  const opciones: LoggerOptions = {
    level: nivel,
    base: { servicio: 'api-gateway', version: VERSION },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      censor: '[REDACTADO]',
    },
  };
  return destino ? pino(opciones, destino) : pino(opciones);
}

let defecto: Logger | null = null;

export const loggerPorDefecto = (): Logger => (defecto ??= crearLogger());

/**
 * Una línea JSON por petición terminada: método, ruta normalizada, estado, duración,
 * identidad del usuario y correlación (`peticion_id`). Las sondas se omiten.
 */
export function logPeticiones(log: Logger): RequestHandler {
  const opciones: Options = {
    logger: log,
    genReqId: (req) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
    autoLogging: { ignore: (req) => esRutaInterna(req) },
    customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    customAttributeKeys: { reqId: 'peticion_id' },
    customSuccessObject: (req, res, val) => ({
      metodo: req.method,
      ruta: rutaNormalizada(req as unknown as Request, res as unknown as Response),
      estado: res.statusCode,
      duracion_ms: val.responseTime,
      ip: req.socket.remoteAddress,
      usuario_id: (req as unknown as Request).usuario?.id,
      rol: (req as unknown as Request).usuario?.rol,
      peticion_id: req.id,
    }),
    customErrorObject: (req, res, err, val) => ({
      metodo: req.method,
      ruta: rutaNormalizada(req as unknown as Request, res as unknown as Response),
      estado: res.statusCode,
      duracion_ms: val?.responseTime,
      ip: req.socket.remoteAddress,
      usuario_id: (req as unknown as Request).usuario?.id,
      peticion_id: req.id,
      error: { mensaje: err.message, tipo: err.name },
    }),
  };
  return pinoHttp(opciones);
}
