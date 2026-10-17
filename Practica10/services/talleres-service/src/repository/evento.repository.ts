// HeinzGomez - Práctica 9: puerto de persistencia de eventos (DIP: el servicio depende de la abstracción)
import { Evento } from '../types/evento';

export interface EventoRepository {
  listar(): Promise<Evento[]>;
  obtener(id: string): Promise<Evento | null>;
  guardar(e: Evento): Promise<void>;
  eliminar(id: string): Promise<boolean>;
  actualizarCupoDisponible(id: string, cupo: number): Promise<void>;
}
