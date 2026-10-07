// HeinzGomez - Práctica 9: publicación de respuestas RPC (cola `replyTo` del solicitante).
// Usa canal con confirmaciones: la respuesta solo se confirma (ack del mensaje) cuando RabbitMQ la acepta.
import amqp from 'amqplib';
import { dormir } from '../config/reintentar';
import { Respuesta } from '../types/mensajes';
import { ConexionBroker } from './conexion';

export interface Destino {
  cola: string;
  correlationId?: string;
}

const TIMEOUT_PUBLICACION_MS = 5000;
const REINTENTOS_PUBLICACION = 3;

export class Productor {
  private canal: amqp.ConfirmChannel | null = null;
  private creando: Promise<amqp.ConfirmChannel> | null = null;

  constructor(private readonly conexion: ConexionBroker) {}

  async responder(destino: Destino, respuesta: Respuesta<unknown>): Promise<void> {
    const contenido = Buffer.from(JSON.stringify(respuesta), 'utf8');
    let ultimoError: unknown;
    for (let intento = 1; intento <= REINTENTOS_PUBLICACION; intento++) {
      try {
        await this.publicar(destino, contenido);
        return;
      } catch (e) {
        ultimoError = e;
        await this.descartarCanal();
        if (intento < REINTENTOS_PUBLICACION) await dormir(200);
      }
    }
    throw ultimoError instanceof Error ? ultimoError : new Error('no se pudo publicar la respuesta');
  }

  private async publicar(destino: Destino, contenido: Buffer): Promise<void> {
    const canal = await this.abrirCanal();
    await new Promise<void>((resolver, rechazar) => {
      let listo = false;
      const terminar = (error?: Error) => {
        if (listo) return;
        listo = true;
        clearTimeout(temporizador);
        if (error) rechazar(error);
        else resolver();
      };
      const temporizador = setTimeout(
        () => terminar(new Error(`sin confirmación del broker tras ${TIMEOUT_PUBLICACION_MS}ms`)),
        TIMEOUT_PUBLICACION_MS,
      );
      canal.publish('', destino.cola, contenido, {
        contentType: 'application/json',
        correlationId: destino.correlationId,
        persistent: true,
      }, (err?: Error | null) => terminar(err ?? undefined));
    });
  }

  private async abrirCanal(): Promise<amqp.ConfirmChannel> {
    if (this.canal) return this.canal;
    if (!this.creando) {
      this.creando = this.conexion
        .canalConfirmado()
        .then((canal) => {
          canal.on('error', (e: Error) => console.warn(`[broker] error de canal de publicación: ${e.message}`));
          canal.on('close', () => {
            if (this.canal === canal) this.canal = null;
          });
          this.canal = canal;
          return canal;
        })
        .finally(() => {
          this.creando = null;
        });
    }
    return this.creando;
  }

  private async descartarCanal(): Promise<void> {
    const actual = this.canal;
    this.canal = null;
    await actual?.close().catch(() => undefined);
  }
}
