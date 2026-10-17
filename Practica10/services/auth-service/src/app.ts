// HeinzGomez - Práctica 10: composición y arranque del Servicio de Autenticación.
//
//   API Gateway --exchange academix.rpc--> cola auth.rpc --> AuthController --> AuthService --> PostgreSQL
//
// Observabilidad: logs JSON (pino) y servidor de sondas en PUERTO (8091) con
// /health (liveness), /health/ready (broker + Postgres) y /metrics (Prometheus).
import type { Logger } from 'pino';
import {
  cerrarBroker, cerrarPool, crearConfiguracionAuth, iniciarConexionBroker, leerEntorno, obtenerPool,
  reintentar, verificarPool,
} from './config';
import { Consumidor } from './broker/consumidor';
import { Productor } from './broker/productor';
import { COLA_AUTH, declararTopologia } from './broker/topologia';
import { AuthController } from './controller/auth.controller';
import { crearLogger, crearMetricas, ServidorSondas } from './observabilidad';
import { PgUsuarioRepository } from './repository/pg-usuario.repository';
import { AuthService } from './service/auth.service';

export async function iniciar(): Promise<void> {
  const entorno = leerEntorno();
  const log = crearLogger(entorno.logLevel);
  const metricas = crearMetricas();

  const pool = obtenerPool(entorno);
  const repositorio = new PgUsuarioRepository(pool);
  await reintentar('postgres', () => repositorio.migrar(entorno.adminCorreo, entorno.adminPassword));

  const servicio = new AuthService(repositorio, crearConfiguracionAuth(entorno));

  // La conexión al broker corre en segundo plano: el servicio arranca aunque RabbitMQ no esté listo
  const broker = iniciarConexionBroker(entorno, metricas.telemetria.broker);
  const consumidor = new Consumidor(broker, {
    cola: COLA_AUTH,
    prefetch: entorno.brokerPrefetch,
    declarar: declararTopologia,
    productor: new Productor(broker),
    telemetria: metricas.telemetria,
    manejadores: new AuthController(servicio, metricas.telemetria, log).manejadores(),
  });
  void consumidor.iniciar().catch((e) => log.error(e, '[broker] consumidor detenido'));

  // Sondas de orquestación: el healthcheck del contenedor y el readiness de K3s leen de aquí
  const servidor = new ServidorSondas(entorno.puerto, metricas, {
    brokerListo: () => broker.estaConectado(),
    baseDatosLista: verificarPool,
  });
  await servidor.iniciar();
  log.info({ puerto: entorno.puerto, cola: COLA_AUTH }, 'auth-service listo');

  registrarApagadoOrdenado(servidor, consumidor, log);
}

function registrarApagadoOrdenado(servidor: ServidorSondas, consumidor: Consumidor, log: Logger): void {
  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    log.info({ senal }, 'cerrando auth-service…');
    await servidor.detener();
    await consumidor.cerrar();
    await cerrarBroker();
    await cerrarPool();
    process.exit(0);
  };
  process.once('SIGTERM', () => void cerrar('SIGTERM'));
  process.once('SIGINT', () => void cerrar('SIGINT'));
}

if (require.main === module) {
  iniciar().catch((e) => {
    console.error(e); // el logger puede no estar disponible si falló la composición
    process.exit(1);
  });
}
