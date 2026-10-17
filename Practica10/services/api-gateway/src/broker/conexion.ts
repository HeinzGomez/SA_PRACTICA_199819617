// HeinzGomez - Práctica 9: conexión RabbitMQ con reapertura perezosa.
// Si el broker se reinicia o cae la TCP, la próxima petición reabre el canal; el Gateway
// nunca se bloquea esperando al broker: falla con UNAVAILABLE y reintenta en la siguiente.
import amqp from 'amqplib';

type Conexion = Awaited<ReturnType<typeof amqp.connect>>;

export class ConexionBroker {
  private conexion: Conexion | null = null;
  private canal: amqp.ConfirmChannel | null = null;
  private abriendo: Promise<void> | null = null;
  private cerrado = false;

  constructor(private readonly url: string, private readonly onEstado?: (conectado: boolean) => void) {}

  /** true si el canal está vivo (no abre conexiones nuevas: solo observa el estado). */
  conectado(): boolean {
    return this.canal !== null;
  }

  /** Canal con confirmaciones: la publicación solo cuenta cuando RabbitMQ la confirma (ACK del productor). */
  async abrir(): Promise<amqp.ConfirmChannel> {
    if (this.cerrado) throw new Error('broker cerrado');
    if (this.canal) return this.canal;
    if (!this.abriendo) {
      this.abriendo = this.abrirConexion().finally(() => { this.abriendo = null; });
    }
    await this.abriendo;
    if (!this.canal) throw new Error('sin conexión con RabbitMQ');
    return this.canal;
  }

  private async abrirConexion(): Promise<void> {
    const conexion = await amqp.connect(this.url);
    const canal = await conexion.createConfirmChannel();
    const soltar = () => this.soltar(canal);
    canal.on('error', soltar);
    canal.on('close', soltar);
    conexion.on('error', soltar);
    conexion.on('close', soltar);
    this.conexion = conexion;
    this.canal = canal;
    this.onEstado?.(true);
  }

  /** Descarta el canal muerto para que la siguiente petición reconecte desde cero. */
  private soltar(canal: amqp.ConfirmChannel): void {
    if (this.canal !== canal) return;
    const conexion = this.conexion;
    this.conexion = null;
    this.canal = null;
    this.onEstado?.(false);
    void conexion?.close().catch(() => undefined);
  }

  async cerrar(): Promise<void> {
    this.cerrado = true;
    const conexion = this.conexion;
    const estabaConectado = this.conexion !== null;
    this.conexion = null;
    this.canal = null;
    await conexion?.close().catch(() => undefined);
    if (estabaConectado) this.onEstado?.(false);
  }
}
