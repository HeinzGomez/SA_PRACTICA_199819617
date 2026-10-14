// HeinzGomez - Práctica 10: consumidor de colas con confirmaciones manuales (ACK/NACK).
//  - ACK solo después de haber publicado la respuesta (nada se pierde ante caídas del worker).
//  - NACK sin reencolar (-> DLQ) cuando el mensaje es irreprocesable: evita bucles infinitos.
//  - Re-suscripción automática si el canal o la conexión mueren.
//  - Ciclo completo con log estructurado: "worker atendiendo" -> "worker respondió" (o "falló"/"descartó").
//
// Separación de responsabilidades: este módulo solo orquesta el ciclo de consumo y la
// confirmación; la lógica de negocio vive en los manejadores (controladores/servicios)
// y las métricas/log llegan inyectados (DIP): ni pino ni Prometheus son obligatorios.
import amqp from 'amqplib';
import type { Logger } from 'pino';
import { dormir } from '../config/reintentar';
import { loggerPorDefecto } from '../observabilidad/logger';
import type { Telemetria } from '../observabilidad/metricas';
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
  /** Métricas del worker/RPC; opcional para no acoplar el broker a Prometheus. */
  telemetria?: Telemetria;
}

/** El cuerpo no es JSON: el mensaje es irreprocesable y va a la DLQ. */
class MensajeInvalido extends Error {}

const ESPERA_DEFECTO_MS = 3000;

export class Consumidor {
  private canal: amqp.Channel | null = null;
  private cerrado = false;

  constructor(
    private readonly conexion: ConexionBroker,
    private readonly opciones: OpcionesConsumidor,
    private readonly log: Logger = loggerPorDefecto(),
  ) {}

  /** Mantiene la suscripción viva; termina solo con cerrar(). */
  async iniciar(): Promise<void> {
    while (!this.cerrado) {
      try {
        await this.consumir();
      } catch (e) {
        if (this.cerrado) return;
        this.log.warn(`[broker] consumo interrumpido (${(e as Error).message}); reintentando…`);
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
      this.log.info(`[broker] consumiendo ${this.opciones.cola} (prefetch ${this.opciones.prefetch})`);
      await canalCerrado;
    } finally {
      if (this.canal === canal) this.canal = null;
    }
  }

  /**
   * Ciclo del worker por cada mensaje: recibir -> atender -> confirmar.
   * Deja constancia del recorrido completo (log + métricas) y devuelve el mensaje
   * a la DLQ solo cuando es irreprocesable (JSON inválido u operación desconocida
   * o error inesperado del handler).
   */
  private async procesar(canal: amqp.Channel, mensaje: amqp.Message): Promise<void> {
    const cola = this.opciones.cola;
    const operacion = mensaje.fields.routingKey;
    const correlationId = mensaje.properties.correlationId;
    const inicio = Date.now();

    this.opciones.telemetria?.worker(cola, 'recibido');
    this.log.info({ cola, operacion, correlation_id: correlationId }, 'worker atendiendo petición');

    try {
      const manejador = this.opciones.manejadores[operacion];
      if (!manejador) throw new Error(`operación no soportada: ${operacion}`);
      await manejador(this.construirEntrada(mensaje));
      canal.ack(mensaje);

      const ms = Date.now() - inicio;
      this.opciones.telemetria?.worker(cola, 'procesado', ms);
      if (this.opciones.productor) this.opciones.telemetria?.rpc(operacion, ms, 'ok');
      this.log.info({
        cola, operacion, correlation_id: correlationId, duracion_ms: ms, resultado: 'ack',
      }, 'worker respondió petición');
    } catch (e) {
      const ms = Date.now() - inicio;
      const invalido = e instanceof MensajeInvalido;
      this.opciones.telemetria?.worker(cola, invalido ? 'invalido' : 'error', ms);
      // el cuerpo inválido nunca llegó al handler: cuenta como mensaje descartado, no como fallo RPC
      if (!invalido && this.opciones.productor) this.opciones.telemetria?.rpc(operacion, ms, 'error');

      if (invalido) {
        this.log.warn({ cola, operacion, motivo: 'json inválido', error: (e as Error).message },
          'worker descartó petición');
      } else {
        this.log.error({
          cola, operacion, correlation_id: correlationId,
          duracion_ms: ms, resultado: 'nack-dlq', error: (e as Error).message,
        }, 'worker falló la petición');
      }
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
      throw new MensajeInvalido('JSON inválido en el cuerpo del mensaje');
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
