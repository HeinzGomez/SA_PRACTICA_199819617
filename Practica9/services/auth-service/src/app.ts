// HeinzGomez - Práctica 9: composición y arranque del Servicio de Autenticación.
//
//   API Gateway --exchange academix.rpc--> cola auth.rpc --> AuthController --> AuthService --> PostgreSQL
//
// El servicio no expone puertos HTTP/gRPC: solo consume el broker y responde en la cola `replyTo`.
import {
  cerrarBroker, cerrarPool, crearConfiguracionAuth, iniciarConexionBroker, leerEntorno, obtenerPool, reintentar,
} from './config';
import { Consumidor } from './broker/consumidor';
import { Productor } from './broker/productor';
import { COLA_AUTH, declararTopologia } from './broker/topologia';
import { AuthController } from './controller/auth.controller';
import { PgUsuarioRepository } from './repository/pg-usuario.repository';
import { AuthService } from './service/auth.service';

export async function iniciar(): Promise<void> {
  const entorno = leerEntorno();

  const pool = obtenerPool(entorno);
  const repositorio = new PgUsuarioRepository(pool);
  await reintentar('postgres', () => repositorio.migrar(entorno.adminCorreo, entorno.adminPassword));

  const servicio = new AuthService(repositorio, crearConfiguracionAuth(entorno));

  // La conexión al broker corre en segundo plano: el servicio arranca aunque RabbitMQ no esté listo
  const broker = iniciarConexionBroker(entorno);
  const consumidor = new Consumidor(broker, {
    cola: COLA_AUTH,
    prefetch: entorno.brokerPrefetch,
    declarar: declararTopologia,
    productor: new Productor(broker),
    manejadores: new AuthController(servicio).manejadores(),
  });
  void consumidor.iniciar().catch((e) => console.error('[broker] consumidor detenido:', e));

  registrarApagadoOrdenado(consumidor);
  console.log(`auth-service listo en la cola ${COLA_AUTH}`);
}

function registrarApagadoOrdenado(consumidor: Consumidor): void {
  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`[${senal}] cerrando auth-service…`);
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
    console.error(e);
    process.exit(1);
  });
}
