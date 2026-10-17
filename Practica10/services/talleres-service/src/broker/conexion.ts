// HeinzGomez - Práctica 10: conexión RabbitMQ con reconexión automática.
// Si el broker se reinicia o cae la TCP, la conexión se restablece sola y los
// consumidores vuelven a suscribirse sin reiniciar el servicio.
import amqp from 'amqplib';
import type { Logger } from 'pino';
import { dormir } from '../config/reintentar';
import { loggerPorDefecto } from '../observabilidad/logger';

type Conexion = Awaited<ReturnType<typeof amqp.connect>>;

export class ConexionBroker {
  private conexion: Conexion | null = null;
  private conectado = false;
  private conectando: Promise<void> | null = null;
  private cerrado = false;

  constructor(
    private readonly url: string,
    private readonly esperaMs = 3000,
    /** Estado de la conexión para el readiness y la métrica de broker (inyectado por el composition root). */
    private readonly onEstado?: (conectado: boolean) => void,
    private readonly log: Logger = loggerPorDefecto(),
  ) {}

  /** Estado actual: lo consulta /health/ready. */
  estaConectado(): boolean {
    return this.conectado;
  }

  /** Un solo intento de conexión (seguro ante llamadas concurrentes). */
  async conectar(): Promise<void> {
    if (this.conectado || this.cerrado) return;
    if (!this.conectando) {
      this.conectando = this.abrir().finally(() => {
        this.conectando = null;
      });
    }
    return this.conectando;
  }

  /** Reintenta hasta conectar o hasta cerrar(). Nunca lanza: el servicio no depende del broker. */
  async conectarConReintentos(): Promise<void> {
    while (!this.cerrado && !this.conectado) {
      try {
        await this.conectar();
        if (this.conectado) this.log.info('[broker] conectado a RabbitMQ');
      } catch (e) {
        if (this.cerrado) return;
        this.log.warn(`[broker] RabbitMQ no disponible (${(e as Error).message}); reintento en ${this.esperaMs}ms`);
        await dormir(this.esperaMs);
      }
    }
  }

  private async abrir(): Promise<void> {
    const conexion = await amqp.connect(this.url);
    conexion.on('error', (e: Error) => this.log.warn(`[broker] error de conexión: ${e.message}`));
    conexion.on('close', () => this.perderConexion());
    this.conexion = conexion;
    this.conectado = true;
    this.onEstado?.(true);
  }

  private perderConexion(): void {
    if (this.cerrado || !this.conectado) return;
    this.conectado = false;
    this.conexion = null;
    this.onEstado?.(false);
    this.log.warn('[broker] conexión perdida; reconectando…');
    void this.conectarConReintentos();
  }

  /** Canal de consumo (ack manual). Lanza si no hay conexión: el consumidor reintenta. */
  async canal(): Promise<amqp.Channel> {
    return this.abrirCanal((c) => c.createChannel());
  }

  /** Canal con confirmaciones para publicar respuestas sin perderlas. */
  async canalConfirmado(): Promise<amqp.ConfirmChannel> {
    return this.abrirCanal((c) => c.createConfirmChannel());
  }

  private async abrirCanal<T>(fn: (conexion: Conexion) => Promise<T>): Promise<T> {
    if (this.cerrado) throw new Error('broker cerrado');
    if (!this.conectado || !this.conexion) throw new Error('sin conexión con RabbitMQ');
    return fn(this.conexion);
  }

  async cerrar(): Promise<void> {
    this.cerrado = true;
    const actual = this.conexion;
    this.conexion = null;
    this.conectado = false;
    await actual?.close().catch(() => undefined);
  }
}
