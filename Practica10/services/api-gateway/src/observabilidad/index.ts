// HeinzGomez - Práctica 10: composición de la observabilidad del API Gateway (logs + métricas + salud).
import type { Logger } from 'pino';
import { crearLogger, logPeticiones, nivelPorDefecto, loggerPorDefecto } from './logger';
import { Metricas, Telemetria, crearMetricas, metricasPorDefecto } from './metricas';
import { esRutaInterna, guardarPrefijo, rutaNormalizada } from './ruta';

/** Lo que `createApp` recibe del proceso: logger, registro de métricas y verificador de readiness. */
export interface Observabilidad {
  log?: Logger;
  metricas?: Metricas;
  verificarBroker?: () => Promise<boolean>;
}

export {
  crearLogger,
  crearMetricas,
  esRutaInterna,
  guardarPrefijo,
  logPeticiones,
  loggerPorDefecto,
  metricasPorDefecto,
  nivelPorDefecto,
  rutaNormalizada,
};
export type { Logger, Metricas, Telemetria };
