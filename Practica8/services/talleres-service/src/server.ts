// HeinzGomez - Práctica 7: arranque del Servicio de Talleres (gRPC :50052 + consumidor RabbitMQ)
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { TalleresService } from './talleres.service';
import { crearHandlers } from './grpc-handlers';
import { consumirConfirmaciones, PgEventoRepository, RedisCupoCache } from './infra/adapters';
import { EVENTOS_SEED } from './seed';

const PROTO = process.env.PROTO_PATH ?? path.resolve(__dirname, '../../../proto/talleres.proto');

async function esperar<T>(nombre: string, fn: () => Promise<T>): Promise<T> {
  for (let i = 1; i <= 30; i++) {
    try { return await fn(); } catch (e) {
      console.log(`[${nombre}] intento ${i} fallido: ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(`${nombre} no disponible`);
}

async function main() {
  const repo = new PgEventoRepository(new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://academix:academix@localhost:5432/talleres_db' }));
  const cache = new RedisCupoCache(new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379'));
  await esperar('postgres', () => repo.migrar(EVENTOS_SEED));
  // Asegura que todo evento persistido tenga su contador en Redis (SET NX no pisa valores vivos)
  for (const e of await repo.listar()) await cache.inicializar(e.id, e.cupo_disponible);

  const svc = new TalleresService(repo, cache);
  // El consumidor se conecta en segundo plano: si RabbitMQ aún no está listo, el catálogo sigue disponible
  const conectarConsumidor = (): void => {
    consumirConfirmaciones(process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672', (id, cupo) => svc.sincronizarCupo(id, cupo),
      () => { console.log('[rabbitmq] conexión cerrada; reconectando'); setTimeout(conectarConsumidor, 3000); })
      .then(() => console.log('consumidor talleres.cupos activo'))
      .catch((e) => { console.log(`[rabbitmq] ${(e as Error).message}; reintento en 3s`); setTimeout(conectarConsumidor, 3000); });
  };
  conectarConsumidor();

  const def = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const pkg = grpc.loadPackageDefinition(def) as any;
  const server = new grpc.Server();
  server.addService(pkg.academix.talleres.v1.TalleresService.service, crearHandlers(svc));
  const port = process.env.GRPC_PORT ?? '50052';
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    console.log(`talleres-service gRPC en :${port}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
