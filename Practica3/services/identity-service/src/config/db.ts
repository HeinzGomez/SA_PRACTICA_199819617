import { Pool } from "pg";
import { env } from "./env";

// Conexion exclusiva a la base de datos de este microservicio
// (patron Database per Microservice). Ningun otro servicio accede
// directamente a este esquema.
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[identity-service] Unexpected error on idle Postgres client", err);
});
