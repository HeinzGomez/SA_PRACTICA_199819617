// HeinzGomez - Práctica 9: conexión a Redis como singleton (contador de cupos en vivo)
import Redis from 'ioredis';
import { Entorno } from './entorno';

let cliente: Redis | null = null;

/** Devuelve el cliente compartido; la primera llamada fija la URL. */
export function obtenerRedis(entorno: Entorno): Redis {
  if (!cliente) cliente = new Redis(entorno.redisUrl);
  return cliente;
}

export async function cerrarRedis(): Promise<void> {
  if (!cliente) return;
  const actual = cliente;
  cliente = null;
  await actual.quit().catch(() => undefined);
}
