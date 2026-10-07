// HeinzGomez - Práctica 9: controlador del Servicio de Talleres.
// Es el adaptador de entrada: mapea las operaciones del bus (antes: RPC gRPC) a los
// casos de uso y traduce los errores de dominio al contrato de respuesta.
import { TalleresService } from '../service/talleres.service';
import { TalleresError, CodigoError } from '../types/errores';
import { Evento, FiltroEventos } from '../types/evento';
import { Entrada, Manejadores, OPERACIONES, Respuesta, exitosa, fallida } from '../types/mensajes';

export class TalleresController {
  constructor(private readonly servicio: TalleresService) {}

  /** Contrato expuesto por el servicio: routing key -> handler. */
  manejadores(): Manejadores {
    return {
      [OPERACIONES.listarEventos]: this.responder(async (cuerpo) =>
        ({ eventos: await this.servicio.listar((cuerpo ?? {}) as FiltroEventos) })),
      [OPERACIONES.obtenerEvento]: this.responder((cuerpo) => this.servicio.obtener(this.id(cuerpo))),
      [OPERACIONES.obtenerCupos]: this.responder(async (cuerpo) =>
        ({ cupos: await this.servicio.cupos(this.eventoIds(cuerpo)) })),
      [OPERACIONES.crearEvento]: this.responder((cuerpo) => this.servicio.crear((cuerpo ?? {}) as Partial<Evento>)),
      [OPERACIONES.actualizarEvento]: this.responder((cuerpo) => this.servicio.actualizar((cuerpo ?? {}) as Partial<Evento>)),
      [OPERACIONES.eliminarEvento]: this.responder(async (cuerpo) =>
        ({ eliminado: await this.servicio.eliminar(this.id(cuerpo)) })),
    };
  }

  private responder<T>(ejecutar: (cuerpo: unknown) => Promise<T>) {
    return async (entrada: Entrada): Promise<void> => {
      const respuesta = await this.ejecutar(ejecutar, entrada.cuerpo);
      if (entrada.replyTo) await entrada.responder(respuesta);
    };
  }

  /** Los errores de negocio se responden como error; solo falla (NACK) lo inesperado. */
  private async ejecutar<T>(fn: (cuerpo: unknown) => Promise<T>, cuerpo: unknown): Promise<Respuesta<T>> {
    try {
      return exitosa(await fn(cuerpo ?? {}));
    } catch (e) {
      const [codigo, mensaje] = this.mapear(e);
      return fallida(codigo, mensaje);
    }
  }

  private mapear(e: unknown): [CodigoError, string] {
    if (e instanceof TalleresError) return [e.code, e.message];
    console.error('[talleres] error inesperado:', e);
    return ['INTERNAL', 'Error interno'];
  }

  private id(cuerpo: unknown): string {
    return String((cuerpo as { id?: unknown } | null)?.id ?? '');
  }

  private eventoIds(cuerpo: unknown): string[] {
    const ids = (cuerpo as { evento_ids?: unknown } | null)?.evento_ids;
    return Array.isArray(ids) ? ids.map(String) : [];
  }
}
