// HeinzGomez - Práctica 10: métricas Prometheus del API Gateway (prom-client).
import type { NextFunction, Request, Response } from 'express';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { esRutaInterna, rutaNormalizada } from './ruta';

/** Eventos del proceso que también instrumenta el bus RPC (`BusRpc`). */
export interface Telemetria {
  rpc(operacion: string, ms: number, estado: 'ok' | 'error'): void;
  broker(conectado: boolean): void;
}

export interface Metricas {
  registro: Registry;
  telemetria: Telemetria;
  middleware: (req: Request, res: Response, next: NextFunction) => void;
}

const BUCKETS_SEGUNDOS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export function crearMetricas(): Metricas {
  const registro = new Registry();
  registro.setDefaultLabels({ servicio: 'api-gateway' });
  collectDefaultMetrics({ register: registro });

  const peticiones = new Counter({
    name: 'academix_http_requests_total',
    help: 'Peticiones HTTP recibidas por el API Gateway',
    labelNames: ['method', 'route', 'status'],
    registers: [registro],
  });
  const duracion = new Histogram({
    name: 'academix_http_request_duration_seconds',
    help: 'Duracion de las peticiones HTTP en segundos',
    labelNames: ['method', 'route'],
    buckets: BUCKETS_SEGUNDOS,
    registers: [registro],
  });
  const enVuelo = new Gauge({
    name: 'academix_http_requests_in_flight',
    help: 'Peticiones HTTP en curso',
    registers: [registro],
  });
  const llamadasRpc = new Counter({
    name: 'academix_rpc_calls_total',
    help: 'Llamadas RPC publicadas en el bus de mensajes',
    labelNames: ['operation', 'status'],
    registers: [registro],
  });
  const duracionRpc = new Histogram({
    name: 'academix_rpc_duration_seconds',
    help: 'Duracion de las llamadas RPC en segundos',
    labelNames: ['operation'],
    buckets: BUCKETS_SEGUNDOS,
    registers: [registro],
  });
  const broker = new Gauge({
    name: 'academix_broker_connected',
    help: 'Conexion con RabbitMQ (1 conectado, 0 desconectado)',
    registers: [registro],
  });
  broker.set(0);

  const middleware = (req: Request, res: Response, next: NextFunction): void => {
    if (esRutaInterna(req)) { next(); return; }
    enVuelo.inc();
    const inicio = Date.now();
    let registrado = false;
    const registrar = () => {
      if (registrado) return;
      registrado = true;
      enVuelo.dec();
      const ruta = rutaNormalizada(req, res);
      peticiones.inc({ method: req.method, route: ruta, status: res.statusCode });
      duracion.observe({ method: req.method, route: ruta }, (Date.now() - inicio) / 1000);
    };
    res.on('finish', registrar);
    res.on('close', () => { if (!res.writableEnded) registrar(); });
    next();
  };

  return {
    registro,
    middleware,
    telemetria: {
      rpc: (operacion, ms, estado) => {
        llamadasRpc.inc({ operation: operacion, status: estado });
        duracionRpc.observe({ operation: operacion }, ms / 1000);
      },
      broker: (conectado) => broker.set(conectado ? 1 : 0),
    },
  };
}

let defecto: Metricas | null = null;

/** Registro único del proceso: evita registrar dos veces la misma métrica. */
export const metricasPorDefecto = (): Metricas => (defecto ??= crearMetricas());
