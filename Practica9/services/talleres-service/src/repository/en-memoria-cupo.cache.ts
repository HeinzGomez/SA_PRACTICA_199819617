// HeinzGomez - Práctica 9: contador de cupos en memoria (pruebas)
import { CupoCache } from './cupo.cache';

export class EnMemoriaCupoCache implements CupoCache {
  readonly cupos = new Map<string, number>();
  async inicializar(id: string, cupo: number) { if (!this.cupos.has(id)) this.cupos.set(id, cupo); }
  async ajustar(id: string, delta: number) { const v = (this.cupos.get(id) ?? 0) + delta; this.cupos.set(id, v); return v; }
  async obtener(ids: string[]) {
    const m = new Map<string, number>();
    ids.forEach((id) => { if (this.cupos.has(id)) m.set(id, this.cupos.get(id)!); });
    return m;
  }
  async eliminar(id: string) { this.cupos.delete(id); }
}
