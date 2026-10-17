// HeinzGomez - Práctica 10: métricas Prometheus del Servicio de Talleres (prom-client).
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Protocolo que consumen el consumidor (worker), la conexión del broker y los
 * controladores. Ellos no importan prom-client (DIP): solo `app.ts` llama a `crearMetricas()`.
 */
export interface Telemetria {
  /** Ciclo del worker: un mensaje recibido/procesado de una cola. */
  worker(cola: string, estado: 'recibido' | 'procesado' | 'error' | 'invalido', ms?: number): void;
  /** Operaciones RPC de la cola talleres.rpc (ok/error + duración). */
  rpc(operacion: string, ms: number, estado: 'ok' | 'error'): void;
  /** Conexión con RabbitMQ (gauge 0/1). */
  broker(conectado: boolean): void;
  /** Cupo de evento sincronizado desde Reservas (resultado del evento de dominio). */
  cupoSincronizado(resultado: 'sincronizado' | 'invalido'): void;
}

export interface Metricas {
  registro: Registry;
  telemetria: Telemetria;
}

const BUCKETS_SEGUNDOS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export function crearMetricas(nombre = 'talleres-service'): Metricas {
  const registro = new Registry();
  registro.setDefaultLabels({ servicio: nombre });
  collectDefaultMetrics({ register: registro });

  const mensajes = new Counter({
    name: 'academix_worker_messages_total',
    help: 'Mensajes de las colas atendidos por los workers',
    labelNames: ['queue', 'status'],
    registers: [registro],
  });
  const duracionWorker = new Histogram({
    name: 'academix_worker_processing_duration_seconds',
    help: 'Duracion del procesamiento de un mensaje en segundos',
    labelNames: ['queue'],
    buckets: BUCKETS_SEGUNDOS,
    registers: [registro],
  });
  const enVuelo = new Gauge({
    name: 'academix_worker_in_flight',
    help: 'Mensajes que los workers estan atendiendo en este momento',
    registers: [registro],
  });
  const llamadasRpc = new Counter({
    name: 'academix_rpc_calls_total',
    help: 'Operaciones RPC atendidas desde la cola talleres.rpc',
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
  const cupos = new Counter({
    name: 'academix_talleres_cupos_sincronizados_total',
    help: 'Cupos de evento sincronizados desde los eventos de Reservas',
    labelNames: ['resultado'],
    registers: [registro],
  });
  const broker = new Gauge({
    name: 'academix_broker_connected',
    help: 'Conexion con RabbitMQ (1 conectado, 0 desconectado)',
    registers: [registro],
  });
  broker.set(0);

  return {
    registro,
    telemetria: {
      worker: (cola, estado, ms) => {
        mensajes.inc({ queue: cola, status: estado });
        if (estado === 'recibido') enVuelo.inc();
        if (estado === 'procesado' || estado === 'error' || estado === 'invalido') {
          enVuelo.dec();
          if (ms !== undefined) duracionWorker.observe({ queue: cola }, ms / 1000);
        }
      },
      rpc: (operacion, ms, estado) => {
        llamadasRpc.inc({ operation: operacion, status: estado });
        duracionRpc.observe({ operation: operacion }, ms / 1000);
      },
      broker: (conectado) => broker.set(conectado ? 1 : 0),
      cupoSincronizado: (resultado) => cupos.inc({ resultado }),
    },
  };
}

let defecto: Metricas | null = null;

/** Registro único del proceso: evita registrar dos veces la misma métrica. */
export const metricasPorDefecto = (): Metricas => (defecto ??= crearMetricas());
