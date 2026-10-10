// HeinzGomez - Práctica 9: bus RPC del API Gateway.
//
//   academix.rpc --<routing key = operación>--> cola <servicio>.rpc
//      │ ACK del productor = confirmación de RabbitMQ tras publicar
//      └─ respuesta -> cola exclusiva de este Gateway con el mismo correlationId (ACK al consumir)
import amqp from 'amqplib';
import { ErrorRpc } from '../types';
import { ConexionBroker } from './conexion';
import { ColaRespuestas, desenvolver } from './cola-respuestas';

export const EXCHANGE_RPC = 'academix.rpc';

const TIMEOUT_PUBLICACION_MS = 5000;

/** Resuelve con `alVencer` cuando pasa el tiempo (nunca rechaza: evita rechazos no atendidos). */
function limitar<T>(promesa: Promise<T>, ms: number, alVencer: T): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const temporizador = setTimeout(() => resolver(alVencer), ms);
    promesa.then(
      (v) => { clearTimeout(temporizador); resolver(v); },
      (e) => { clearTimeout(temporizador); rechazar(e); },
    );
  });
}

export class BusRpc {
  private readonly conexion: ConexionBroker;
  private readonly cola: ColaRespuestas;

  constructor(url: string, private readonly timeoutMs: number) {
    this.conexion = new ConexionBroker(url);
    this.cola = new ColaRespuestas();
  }

  /**
   * Publica una operación y espera su respuesta.
   * Lanza `ErrorRpc` con el código del servicio (o UNAVAILABLE si el broker no responde).
   */
  async enviar<T>(operacion: string, payload: unknown): Promise<T> {
    const canal = await this.abrirCanal();
    await this.cola.preparar(canal);

    const corr = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const cuerpo = this.cola.esperar(corr, this.timeoutMs, operacion);

    try {
      await this.publicar(canal, operacion, corr, payload);
    } catch {
      this.cola.cancelar(corr);
      throw new ErrorRpc('UNAVAILABLE', 'No se pudo publicar la petición en el bus de mensajes');
    }
    return desenvolver<T>(await cuerpo);
  }

  async cerrar(): Promise<void> {
    await this.conexion.cerrar();
  }

  private async abrirCanal(): Promise<amqp.ConfirmChannel> {
    try {
      const canal = await this.conexion.abrir();
      // El exchange lo comparten todos: declararlo aquí es idempotente y evita NOT_FOUND en el arranque.
      await canal.assertExchange(EXCHANGE_RPC, 'direct', { durable: true });
      return canal;
    } catch {
      throw new ErrorRpc('UNAVAILABLE', 'Servicio temporalmente no disponible, intente de nuevo');
    }
  }

  private async publicar(canal: amqp.ConfirmChannel, operacion: string, corr: string, payload: unknown): Promise<void> {
    const cuerpo = Buffer.from(JSON.stringify(payload ?? {}), 'utf8');
    const confirmado = await limitar(
      new Promise<boolean>((resolver, rechazar) => {
        try {
          canal.publish(EXCHANGE_RPC, operacion, cuerpo, {
            contentType: 'application/json',
            correlationId: corr,
            replyTo: this.cola.cola,
            persistent: true,
          }, (err) => (err ? rechazar(err) : resolver(true)));
        } catch (e) {
          rechazar(e as Error);
        }
      }),
      TIMEOUT_PUBLICACION_MS,
      false,
    ).catch(() => false);
    if (!confirmado) throw new Error('sin confirmación del broker');
  }
}
