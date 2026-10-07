// HeinzGomez - Práctica 9: puerto del contador de cupos en vivo.
/** Contador atómico compartido con el Servicio de Reservas (Redis: cupo:evento:{id}). */
export interface CupoCache {
  inicializar(id: string, cupo: number): Promise<void>;
  ajustar(id: string, delta: number): Promise<number>;
  obtener(ids: string[]): Promise<Map<string, number>>;
  eliminar(id: string): Promise<void>;
}
