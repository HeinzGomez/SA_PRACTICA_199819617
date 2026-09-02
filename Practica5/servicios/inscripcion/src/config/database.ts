import { Pool } from "pg";
import { config } from "./environment";

let instance: Pool | null = null;

export function getDatabase(): Pool {
  if (!instance) {
    instance = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.pass,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    instance.on("error", (err) => {
      console.error("[Database] Error inesperado en el pool de conexiones:", err.message);
    });
  }

  return instance;
}

export async function closeDatabase(): Promise<void> {
  if (instance) {
    await instance.end();
    instance = null;
  }
}
