// HeinzGomez - Práctica 10: observabilidad del Servicio de Talleres (logs + métricas + salud).
export { crearLogger, loggerPorDefecto, nivelPorDefecto } from './logger';
export { crearMetricas, metricasPorDefecto } from './metricas';
export type { Metricas, Telemetria } from './metricas';
export { ServidorSondas, verificarSalud } from './servidor';
export type { Sondas } from './servidor';
export { codigoDeSalida } from './healthcheck';
