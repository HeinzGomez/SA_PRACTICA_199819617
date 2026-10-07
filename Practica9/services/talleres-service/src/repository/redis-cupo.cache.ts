// HeinzGomez - Práctica 9: contador de cupos en vivo (Redis) compartido con Reservas.
// Claves:
//   cupo:evento:{id}       -> contador de disponibles (lo inicializa este servicio; lo descuenta Reservas)
//   inscritos:evento:{id}  -> SET de usuarios confirmados (lo administra Reservas con script Lua)
import Redis from 'ioredis';
import { CupoCache } from './cupo.cache';

export const cupoKey = (id: string) => `cupo:evento:${id}`;

export class RedisCupoCache implements CupoCache {
  constructor(private readonly redis: Redis) {}

  /** SET NX: no pisa un contador vivo si el servicio se reinicia. */
  async inicializar(id: string, cupo: number) { await this.redis.set(cupoKey(id), cupo, 'NX'); }
  async ajustar(id: string, delta: number) { return this.redis.incrby(cupoKey(id), delta); }
  async obtener(ids: string[]) {
    if (!ids.length) return new Map<string, number>();
    const vals = await this.redis.mget(ids.map(cupoKey));
    const m = new Map<string, number>();
    ids.forEach((id, i) => { if (vals[i] !== null) m.set(id, Number(vals[i])); });
    return m;
  }
  async eliminar(id: string) { await this.redis.del(cupoKey(id)); }
}
