// HeinzGomez - Práctica 10: conexión a PostgreSQL como singleton (una única piscina por proceso)
import { Pool } from 'pg';
import { Entorno } from './entorno';

let pool: Pool | null = null;

/** Devuelve la piscina compartida; la primera llamada fija la cadena de conexión. */
export function obtenerPool(entorno: Entorno): Pool {
  if (!pool) pool = new Pool({ connectionString: entorno.databaseUrl });
  return pool;
}

/** Sondeo del readiness: la piscina responde a un `SELECT 1`. */
export async function verificarPool(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function cerrarPool(): Promise<void> {
  if (!pool) return;
  const actual = pool;
  pool = null;
  await actual.end();
}
