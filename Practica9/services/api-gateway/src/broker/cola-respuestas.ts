// HeinzGomez - Práctica 9: cola exclusiva de respuestas RPC del Gateway (ACK manual).
//  - Cola `replyTo` con nombre de servidor y exclusiva de esta conexión: cada reinicio crea una nueva.
//  - ACK solo después de resolver la petición pendiente; un mensaje sin correlationId también se
//    confirma para que no se reentregue infinitamente.
//  - Si el canal muere, las peticiones en vuelo fallan con UNAVAILABLE en vez de esperar al timeout.
import amqp from 'amqplib';
import { ErrorRpc, Respuesta } from '../types';

interface Pendiente {
  resolver: (cuerpo: unknown) => void;
  rechazar: (error: Error) => void;
  temporizador: NodeJS.Timeout;
}

const MENSAJE_INTERRUMPIDO = 'Conexión con el bus de mensajes interrumpida';

export class ColaRespuestas {
  private canal: amqp.ConfirmChannel | null = null;
  private nombre = '';
  private pendientes = new Map<string, Pendiente>();

  /** Nombre de la cola de respuesta (`replyTo` de cada petición). */
  get cola(): string {
    return this.nombre;
  }

  /** Declara y consume la cola; se rehace sola cuando cambia el canal (conexión restablecida). */
  async preparar(canal: amqp.ConfirmChannel): Promise<void> {
    if (this.canal === canal) return;
    if (this.canal) this.interrumpir();
    const creada = await canal.assertQueue('', { durable: false, exclusive: true, autoDelete: true });
    this.canal = canal;
    this.nombre = creada.queue;
    await canal.consume(creada.queue, (mensaje) => { if (mensaje) this.recibir(canal, mensaje); }, { noAck: false });
  }

  /** Promesa que se resuelve con el cuerpo de la respuesta de esa petición. */
  esperar(corr: string, timeoutMs: number, operacion: string): Promise<unknown> {
    return new Promise((resolver, rechazar) => {
      const temporizador = setTimeout(() => {
        this.pendientes.delete(corr);
        rechazar(new ErrorRpc('UNAVAILABLE', `Sin respuesta de ${operacion} tras ${timeoutMs}ms`));
      }, timeoutMs);
      this.pendientes.set(corr, { resolver, rechazar, temporizador });
    });
  }

  /** Olvida una petición cuya publicación falló (el temporizador ya no debe rechazarla). */
  cancelar(corr: string): void {
    const pendiente = this.pendientes.get(corr);
    if (!pendiente) return;
    this.pendientes.delete(corr);
    clearTimeout(pendiente.temporizador);
  }

  /** El canal anterior murió: nadie podrá responder esas peticiones. */
  private interrumpir(): void {
    const error = new ErrorRpc('UNAVAILABLE', MENSAJE_INTERRUMPIDO);
    for (const [corr, pendiente] of this.pendientes) {
      this.pendientes.delete(corr);
      clearTimeout(pendiente.temporizador);
      pendiente.rechazar(error);
    }
    this.canal = null;
    this.nombre = '';
  }

  private recibir(canal: amqp.ConfirmChannel, mensaje: amqp.ConsumeMessage): void {
    const corr = String(mensaje.properties.correlationId ?? '');
    const pendiente = corr ? this.pendientes.get(corr) : undefined;
    try {
      if (!pendiente) return; // respuesta tardía o ajena: se descarta, el timeout ya hizo su trabajo
      this.pendientes.delete(corr);
      clearTimeout(pendiente.temporizador);
      pendiente.resolver(this.parsear(mensaje.content));
    } finally {
      canal.ack(mensaje);
    }
  }

  private parsear(contenido: Buffer): unknown {
    try {
      return JSON.parse(contenido.toString('utf8'));
    } catch {
      throw new ErrorRpc('INTERNAL', 'Respuesta ilegible del servicio');
    }
  }
}

/** Desenvuelve el contrato {ok,datos} | {ok,error} y traduce el error a una excepción con código. */
export function desenvolver<T>(cuerpo: unknown): T {
  const r = cuerpo as Respuesta<T> | null;
  if (r && r.ok === true) return r.datos;
  if (r && r.ok === false) {
    throw new ErrorRpc(String(r.error?.codigo ?? 'INTERNAL'), String(r.error?.mensaje ?? 'Error interno'));
  }
  throw new ErrorRpc('INTERNAL', 'Respuesta ilegible del servicio');
}
