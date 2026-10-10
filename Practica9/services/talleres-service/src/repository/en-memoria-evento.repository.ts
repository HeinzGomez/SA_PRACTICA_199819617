// HeinzGomez - Práctica 9: repositorio en memoria (pruebas)
import { Evento } from '../types/evento';
import { EventoRepository } from './evento.repository';

export class EnMemoriaEventoRepository implements EventoRepository {
  private readonly datos = new Map<string, Evento>();
  constructor(iniciales: Evento[] = []) { iniciales.forEach((e) => this.datos.set(e.id, { ...e })); }
  async listar() { return [...this.datos.values()].map((e) => ({ ...e })); }
  async obtener(id: string) { const e = this.datos.get(id); return e ? { ...e } : null; }
  async guardar(e: Evento) { this.datos.set(e.id, { ...e }); }
  async eliminar(id: string) { return this.datos.delete(id); }
  async actualizarCupoDisponible(id: string, cupo: number) {
    const e = this.datos.get(id);
    if (e) e.cupo_disponible = cupo;
  }
}
