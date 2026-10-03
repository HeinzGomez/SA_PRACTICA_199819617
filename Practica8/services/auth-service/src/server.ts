// HeinzGomez - Práctica 7: arranque del Servicio de Autenticación (gRPC :50051)
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Pool } from 'pg';
import { AuthService } from './auth.service';
import { PgUsuarioRepository } from './pg-repository';
import { crearHandlers } from './grpc-handlers';

const PROTO = process.env.PROTO_PATH ?? path.resolve(__dirname, '../../../proto/auth.proto');

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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? 'postgres://academix:academix@localhost:5432/auth_db' });
  const repo = new PgUsuarioRepository(pool);
  await esperar('postgres', () => repo.migrar(
    process.env.ADMIN_EMAIL ?? 'admin@ingenieria.usac.edu.gt',
    process.env.ADMIN_PASSWORD ?? 'Admin12345',
  ));

  const svc = new AuthService(repo, {
    jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-cambiar',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
    dominiosPermitidos: (process.env.ALLOWED_EMAIL_DOMAINS ?? 'ingenieria.usac.edu.gt,usac.edu.gt').split(','),
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  });

  const def = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true });
  const pkg = grpc.loadPackageDefinition(def) as any;
  const server = new grpc.Server();
  server.addService(pkg.academix.auth.v1.AuthService.service, crearHandlers(svc));
  const port = process.env.GRPC_PORT ?? '50051';
  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) throw err;
    console.log(`auth-service gRPC en :${port}`);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
