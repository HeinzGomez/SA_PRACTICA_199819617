// HeinzGomez - Práctica 10: rutas normalizadas de observabilidad del API Gateway.
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const PREFIJO = 'prefijo_ruta';

/**
 * Express restaura `req.baseUrl` al salir del router, así que cuando pino y Prometheus
 * leen la ruta en el evento `finish` el montaje ya se perdió. Este middleware se monta
 * delante de cada router, donde `req.baseUrl` aún es el prefijo limpio (`/api/reservas`),
 * y lo guarda en `res.locals` para recomponer el patrón con `req.route.path`.
 */
export const guardarPrefijo: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.locals[PREFIJO] = req.baseUrl;
  next();
};

/**
 * Patrón de Express (`/api/reservas/:ticketId`) en lugar de la URL concreta:
 * mantiene baja la cardinalidad de las etiquetas `route` de Prometheus y de los logs.
 */
export function rutaNormalizada(peticion: Request, respuesta?: Response): string {
  const ruta = peticion.route?.path;
  if (typeof ruta !== 'string') return 'no_encontrada';
  const prefijo = (respuesta?.locals?.[PREFIJO] as string | undefined) ?? peticion.baseUrl;
  const completa = `${prefijo}${ruta}`;
  if (completa.length > 1) return completa.replace(/\/+$/, '') || '/';
  return completa;
}

/** Sondas de salud y de Prometheus: no se registran como tráfico de negocio. */
export function esRutaInterna(peticion: { url?: string; path?: string }): boolean {
  const ruta = (peticion.url ?? peticion.path ?? '').split('?')[0];
  return ruta === '/metrics' || ruta.startsWith('/health');
}
