// HeinzGomez - Práctica 9: composición y arranque del Servicio de Talleres.
//
//   (A) API Gateway --exchange academix.rpc--> cola talleres.rpc --> TalleresController --> TalleresService
//   (B) Reservas --exchange academix.events--> cola talleres.cupos --> EventosController --> sincronizarCupo
//
// El cupo en vivo vive en Redis (lo descuenta Reservas de forma atómica); Postgres es la
// réplica que se usa como fallback. El servicio no expone puertos HTTP/gRPC.
import {
  cerrarBroker, cerrarPool, cerrarRedis, iniciarConexionBroker, leerEntorno, obtenerPool, obtenerRedis, reintentar,
} from './config';
import { Consumidor } from './broker/consumidor';
import { Productor } from './broker/productor';
import { COLA_CUPOS, COLA_RPC, declararColaCupos, declararColaRpc } from './broker/topologia';
import { EventosController } from './controller/eventos.controller';
import { TalleresController } from './controller/talleres.controller';
import { PgEventoRepository } from './repository/pg-evento.repository';
import { RedisCupoCache } from './repository/redis-cupo.cache';
import { EVENTOS_SEED } from './repository/seed';
import { TalleresService } from './service/talleres.service';

export async function iniciar(): Promise<void> {
  const entorno = leerEntorno();

  const repo = new PgEventoRepository(obtenerPool(entorno));
  const cache = new RedisCupoCache(obtenerRedis(entorno));
  await reintentar('postgres', () => repo.migrar(EVENTOS_SEED));
  await reintentar('redis', () => obtenerRedis(entorno).ping());
  // Asegura que todo evento persistido tenga su contador en Redis (SET NX no pisa valores vivos)
  for (const e of await repo.listar()) await cache.inicializar(e.id, e.cupo_disponible);

  const servicio = new TalleresService(repo, cache);

  // La conexión al broker corre en segundo plano: si RabbitMQ aún no está listo, el catálogo sigue disponible
  const broker = iniciarConexionBroker(entorno);
  const consumidores = [
    // (A) RPC con el API Gateway
    new Consumidor(broker, {
      cola: COLA_RPC,
      prefetch: entorno.rpcPrefetch,
      declarar: declararColaRpc,
      productor: new Productor(broker),
      manejadores: new TalleresController(servicio).manejadores(),
    }),
    // (B) cupos en tiempo real publicados por Reservas
    new Consumidor(broker, {
      cola: COLA_CUPOS,
      prefetch: entorno.cuposPrefetch,
      declarar: declararColaCupos,
      manejadores: new EventosController(servicio).manejadores(),
    }),
  ];
  // Cada consumidor corre en paralelo con su propio canal: el RPC nunca bloquea la sincronización de cupos
  for (const consumidor of consumidores) {
    void consumidor.iniciar().catch((e) => console.error('[broker] consumidor detenido:', e));
  }

  registrarApagadoOrdenado(consumidores);
  console.log(`talleres-service listo en las colas ${COLA_RPC} y ${COLA_CUPOS}`);
}

function registrarApagadoOrdenado(consumidores: Consumidor[]): void {
  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`[${senal}] cerrando talleres-service…`);
    await Promise.all(consumidores.map((c) => c.cerrar()));
    await cerrarBroker();
    await cerrarRedis();
    await cerrarPool();
    process.exit(0);
  };
  process.once('SIGTERM', () => void cerrar('SIGTERM'));
  process.once('SIGINT', () => void cerrar('SIGINT'));
}

if (require.main === module) {
  iniciar().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
