// HeinzGomez - Práctica 9: consumidor de colas con confirmaciones manuales (ACK/NACK).
//  - ACK solo después de haber publicado la respuesta (nada se pierde ante caídas del worker).
//  - NACK sin reencolar (-> DLQ) cuando el mensaje es irreprocesable: evita bucles infinitos.
//  - Re-suscripción automática si el canal o la conexión mueren.
import amqp from 'amqplib';
import { dormir } from '../config/reintentar';
import { Entrada, Manejadores, Respuesta } from '../types/mensajes';
import { ConexionBroker } from './conexion';
import { Productor } from './productor';

export interface OpcionesConsumidor {
  cola: string;
  prefetch: number;
  manejadores: Manejadores;
  /** Declara la topología de esta cola antes de suscribirse (idempotente). */
  declarar?: (canal: amqp.Channel) => Promise<void>;
  /** Solo hace falta en colas RPC: publica la respuesta en `replyTo`. */
  productor?: Productor;
  esperaReintentoMs?: number;
}

const ESPERA_DEFECTO_MS = 3000;

export class Consumidor {
  private canal: amqp.Channel | null = null;
  private cerrado = false;

  constructor(
    private readonly conexion: ConexionBroker,
    private readonly opciones: OpcionesConsumidor,
  ) {}

  /** Mantiene la suscripción viva; termina solo con cerrar(). */
  async iniciar(): Promise<void> {
    while (!this.cerrado) {
      try {
        await this.consumir();
      } catch (e) {
        if (this.cerrado) return;
        console.warn(`[broker] consumo interrumpido (${(e as Error).message}); reintentando…`);
      }
      if (!this.cerrado) await dormir(this.esperaReintentoMs);
    }
  }

  async cerrar(): Promise<void> {
    this.cerrado = true;
    const actual = this.canal;
    this.canal = null;
    await actual?.close().catch(() => undefined);
  }

  private get esperaReintentoMs(): number {
    return this.opciones.esperaReintentoMs ?? ESPERA_DEFECTO_MS;
  }

  private async consumir(): Promise<void> {
    const canal = await this.conexion.canal();
    this.canal = canal;
    try {
      if (this.opciones.declarar) await this.opciones.declarar(canal);
      await canal.prefetch(this.opciones.prefetch);
      const canalCerrado = new Promise<void>((resolver) => {
        canal.on('close', () => resolver());
        canal.on('error', () => resolver());
      });
      await canal.consume(this.opciones.cola, (mensaje) => {
        if (mensaje) void this.procesar(canal, mensaje);
      });
      console.log(`[broker] consumiendo ${this.opciones.cola} (prefetch ${this.opciones.prefetch})`);
      await canalCerrado;
    } finally {
      if (this.canal === canal) this.canal = null;
    }
  }

  private async procesar(canal: amqp.Channel, mensaje: amqp.Message): Promise<void> {
    try {
      const manejador = this.opciones.manejadores[mensaje.fields.routingKey];
      if (!manejador) throw new Error(`operación no soportada: ${mensaje.fields.routingKey}`);
      await manejador(this.construirEntrada(mensaje));
      canal.ack(mensaje);
    } catch (e) {
      console.error(`[broker] mensaje descartado (${mensaje.fields.routingKey}): ${(e as Error).message}`);
      try {
        if (!this.cerrado) canal.nack(mensaje, false, false);
      } catch {
        // el canal ya no existe: el mensaje vuelve a la cola al reconectar
      }
    }
  }

  private construirEntrada(mensaje: amqp.Message): Entrada {
    let cuerpo: unknown;
    try {
      cuerpo = JSON.parse(mensaje.content.toString('utf8'));
    } catch {
      throw new Error('JSON inválido en el cuerpo del mensaje');
    }
    const operacion = mensaje.fields.routingKey;
    const replyTo = mensaje.properties.replyTo;
    const correlationId = mensaje.properties.correlationId;
    const productor = this.opciones.productor;
    const responder = async (respuesta: Respuesta<unknown>): Promise<void> => {
      if (!replyTo) throw new Error(`falta replyTo en ${operacion}: no hay dónde responder`);
      if (!productor) throw new Error(`la cola ${this.opciones.cola} no tiene productor de respuestas`);
      await productor.responder({ cola: replyTo, correlationId }, respuesta);
    };
    return { operacion, cuerpo, replyTo, correlationId, responder };
  }
}
