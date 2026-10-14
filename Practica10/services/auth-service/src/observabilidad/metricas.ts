// HeinzGomez - Práctica 10: métricas Prometheus del Servicio de Autenticación (prom-client).
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Eventos que reportan el broker y el controlador. El protocolo es una interfaz: los
 * módulos no conocen Prometheus (DIP); solo `app.ts` instancia `crearMetricas()`.
 */
export interface Telemetria {
  rpc(operacion: string, ms: number, estado: 'ok' | 'error'): void;
  broker(conectado: boolean): void;
  registro(): void;
  login(estado: 'exitoso' | 'fallido'): void;
}

export interface Metricas {
  registro: Registry;
  telemetria: Telemetria;
}

const BUCKETS_SEGUNDOS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export function crearMetricas(nombre = 'auth-service'): Metricas {
  const registro = new Registry();
  registro.setDefaultLabels({ servicio: nombre });
  collectDefaultMetrics({ register: registro });

  const llamadasRpc = new Counter({
    name: 'academix_rpc_calls_total',
    help: 'Operaciones RPC atendidas desde la cola auth.rpc',
    labelNames: ['operation', 'status'],
    registers: [registro],
  });
  const duracionRpc = new Histogram({
    name: 'academix_rpc_duration_seconds',
    help: 'Duracion de las operaciones RPC en segundos',
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
  const registros = new Counter({
    name: 'academix_auth_registros_total',
    help: 'Usuarios registrados con exito',
    registers: [registro],
  });
  const logins = new Counter({
    name: 'academix_auth_login_total',
    help: 'Intentos de login por resultado (exitoso o fallido)',
    labelNames: ['resultado'],
    registers: [registro],
  });

  return {
    registro,
    telemetria: {
      rpc: (operacion, ms, estado) => {
        llamadasRpc.inc({ operation: operacion, status: estado });
        duracionRpc.observe({ operation: operacion }, ms / 1000);
      },
      broker: (conectado) => broker.set(conectado ? 1 : 0),
      registro: () => registros.inc(),
      login: (estado) => logins.inc({ resultado: estado }),
    },
  };
}

let defecto: Metricas | null = null;

/** Registro único del proceso: evita registrar dos veces la misma métrica. */
export const metricasPorDefecto = (): Metricas => (defecto ??= crearMetricas());
