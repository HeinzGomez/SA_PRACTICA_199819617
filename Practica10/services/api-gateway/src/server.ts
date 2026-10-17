// HeinzGomez - Práctica 10: inicialización del API Gateway (HTTP :8080 -> bus de mensajes).
//
//   frontend -> Express -> routes/ -> rpc/ -> broker/ (exchange academix.rpc) -> <servicio>.rpc
//   Observabilidad: logs JSON (LOG_LEVEL), métricas Prometheus en /metrics y salud en /health|/health/ready
import { Server } from 'node:http';
import type { Logger } from 'pino';
import { BusRpc } from './broker';
import { createApp } from './app';
import { leerEntorno } from './config';
import { crearLogger, crearMetricas } from './observabilidad';
import { crearServicios } from './rpc';

export function iniciar(): void {
  const log = crearLogger();
  const metricas = crearMetricas();
  const entorno = leerEntorno();

  const bus = new BusRpc(entorno.rabbitmqUrl, entorno.rpcTimeoutMs, { log, telemetria: metricas.telemetria });
  const app = createApp(crearServicios(bus), entorno, { log, metricas, verificarBroker: () => bus.probar() });

  const servidor: Server = app.listen(entorno.puerto, () => {
    log.info({ puerto: entorno.puerto, broker: entorno.rabbitmqUrl, pid: process.pid }, 'api_gateway_escuchando');
  });

  registrarApagadoOrdenado(servidor, bus, log);
  registrarErroresNoCapturados(log);
}

function registrarApagadoOrdenado(servidor: Server, bus: BusRpc, log: Logger): void {
  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    log.warn({ senal }, 'cerrando_api_gateway');
    servidor.close();
    await bus.cerrar();
    log.info({ senal }, 'api_gateway_detenido');
    process.exit(0);
  };
  process.once('SIGTERM', () => void cerrar('SIGTERM'));
  process.once('SIGINT', () => void cerrar('SIGINT'));
}

/** Los errores sin manejador deben dejar rastro en el log antes de terminar el proceso. */
function registrarErroresNoCapturados(log: Logger): void {
  process.on('unhandledRejection', (motivo) => {
    log.error({ motivo: motivo instanceof Error ? motivo.message : String(motivo) }, 'promesa_rechazada_sin_manejar');
  });
  process.on('uncaughtException', (err) => {
    log.fatal({ err }, 'excepcion_no_capturada');
    process.exit(1);
  });
}

if (require.main === module) {
  iniciar();
}
