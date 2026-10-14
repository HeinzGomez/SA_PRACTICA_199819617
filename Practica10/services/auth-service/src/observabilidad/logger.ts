// HeinzGomez - Práctica 10: logging estructurado (JSON por stdout) con pino.
import pino, { DestinationStream, Logger, LoggerOptions } from 'pino';

const VERSION = process.env.SERVICE_VERSION ?? '1.0.0';

/** `LOG_LEVEL` por variable de entorno; silencioso bajo Jest para no ensuciar la salida de las pruebas. */
export function nivelPorDefecto(): string {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return 'silent';
  return process.env.LOG_LEVEL ?? 'info';
}

export function crearLogger(nivel: string = nivelPorDefecto(), destino?: DestinationStream): Logger {
  const opciones: LoggerOptions = {
    level: nivel,
    base: { servicio: 'auth-service', version: VERSION },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['password', 'passwordHash', 'token', 'jwt', '*.password', '*.passwordHash', '*.token', '*.jwt'],
      censor: '[REDACTADO]',
    },
  };
  return destino ? pino(opciones, destino) : pino(opciones);
}

let defecto: Logger | null = null;

/** Logger único del proceso: la misma instancia en todo el servicio. */
export const loggerPorDefecto = (): Logger => (defecto ??= crearLogger());
