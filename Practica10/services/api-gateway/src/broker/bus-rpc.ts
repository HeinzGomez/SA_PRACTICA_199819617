// HeinzGomez - Práctica 9: bus RPC del API Gateway.
//
//   academix.rpc --<routing key = operación>--> cola <servicio>.rpc
//      │ ACK del productor = confirmación de RabbitMQ tras publicar
//      └─ respuesta -> cola exclusiva de este Gateway con el mismo correlationId (ACK al consumir)
import amqp from 'amqplib';
import type { Logger } from 'pino';
import type { Telemetria } from '../observabilidad';
import { ErrorRpc } from '../types';
import { ConexionBroker } from './conexion';
import { ColaRespuestas, desenvolver } from './cola-respuestas';

export const EXCHANGE_RPC = 'academix.rpc';

/** Lo que el proceso inyecta para observar el bus: logs estructurados y métricas. */
export interface ObservabilidadBus {
  log?: Logger;
  telemetria?: Telemetria;
}

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

  constructor(url: string, private readonly timeoutMs: number, private readonly obs?: ObservabilidadBus) {
    this.conexion = new ConexionBroker(url, (conectado) => {
      obs?.telemetria?.broker(conectado);
      obs?.log?.info({ conectado }, conectado ? 'broker_conectado' : 'broker_desconectado');
    });
    this.cola = new ColaRespuestas();
  }

  /**
   * Publica una operación y espera su respuesta.
   * Lanza `ErrorRpc` con el código del servicio (o UNAVAILABLE si el broker no responde).
   */
  async enviar<T>(operacion: string, payload: unknown): Promise<T> {
    const inicio = Date.now();
    try {
      const respuesta = await this.publicarYEsperar<T>(operacion, payload);
      this.obs?.telemetria?.rpc(operacion, Date.now() - inicio, 'ok');
      return respuesta;
    } catch (e) {
      const duracionMs = Date.now() - inicio;
      this.obs?.telemetria?.rpc(operacion, duracionMs, 'error');
      this.obs?.log?.warn(
        { operacion, duracion_ms: duracionMs, codigo: (e as { code?: string })?.code ?? 'ERROR' },
        'rpc_fallida',
      );
      throw e;
    }
  }

  /** Readiness del broker: abre (o reutiliza) el canal y comprueba el exchange RPC con tope de tiempo. */
  async probar(timeoutMs = 1500): Promise<boolean> {
    const verificacion = this.abrirCanal().then((canal) => canal.checkExchange(EXCHANGE_RPC)).then(() => true);
    return limitar(verificacion, timeoutMs, false).catch(() => false);
  }

  async cerrar(): Promise<void> {
    await this.conexion.cerrar();
  }

  private async publicarYEsperar<T>(operacion: string, payload: unknown): Promise<T> {
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
