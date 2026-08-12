import { startGrpcServer } from "./grpc/server";
import { pool } from "./config/db";

async function bootstrap() {
  await pool.query("SELECT 1"); // verifica conectividad con Postgres al iniciar
  // eslint-disable-next-line no-console
  console.log("[identity-service] Conectado a PostgreSQL (identity_db).");
  startGrpcServer();
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[identity-service] Error de arranque:", err);
  process.exit(1);
});
