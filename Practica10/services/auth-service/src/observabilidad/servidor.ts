// HeinzGomez - Práctica 10: servidor HTTP mínimo de observabilidad (liveness, readiness y /metrics).
// El servicio no usa express: se apoya en el módulo nativo http para no añadir dependencias.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Metricas } from './metricas';

const VERSION = process.env.SERVICE_VERSION ?? '1.0.0';

/** Lo que el composition root inyecta: estado real de las dependencias del servicio. */
export interface Sondas {
  brokerListo: () => boolean;
  baseDatosLista: () => Promise<boolean>;
}

const sello = () => ({
  servicio: 'auth-service',
  version: VERSION,
  uptime_s: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

export class ServidorSondas {
  private servidor: http.Server | null = null;
  private puertoReal = 0;

  constructor(
    private readonly puerto: number,
    private readonly metricas: Metricas,
    private readonly sondas: Sondas,
  ) {}

  /** Escucha en `puerto` (0 = puerto efímero, útil en pruebas) y devuelve el puerto real. */
  async iniciar(): Promise<number> {
    if (this.servidor) return this.puertoReal;
    const servidor = http.createServer((req, res) => this.atender(req, res));
    await new Promise<void>((resolver, rechazar) => {
      servidor.once('error', rechazar);
      servidor.listen(this.puerto, () => {
        servidor.removeListener('error', rechazar);
        resolver();
      });
    });
    this.servidor = servidor;
    this.puertoReal = (servidor.address() as AddressInfo).port;
    return this.puertoReal;
  }

  async detener(): Promise<void> {
    const servidor = this.servidor;
    this.servidor = null;
    this.puertoReal = 0;
    if (!servidor) return;
    await new Promise<void>((resolver) => servidor.close(() => resolver()));
  }

  private atender(req: http.IncomingMessage, res: http.ServerResponse): void {
    const ruta = (req.url ?? '').split('?')[0];
    if (ruta === '/health') {
      this.json(res, 200, { status: 'ok', ...sello() });
      return;
    }
    if (ruta === '/health/ready') {
      void this.readiness(res);
      return;
    }
    if (ruta === '/metrics') {
      void this.metricasTexto(res);
      return;
    }
    this.json(res, 404, { status: 'no_encontrado', ...sello() });
  }

  /** Readiness: vivo no basta; el broker y la base de datos deben responder (readinessProbe de K3s). */
  private async readiness(res: http.ServerResponse): Promise<void> {
    const broker = (await this.seguro(this.sondas.brokerListo)) ? 'ok' : 'down';
    const baseDatos = (await this.seguro(this.sondas.baseDatosLista)) ? 'ok' : 'down';
    const listo = broker === 'ok' && baseDatos === 'ok';
    this.json(res, listo ? 200 : 503, {
      status: listo ? 'ready' : 'not_ready', broker, base_datos: baseDatos, ...sello(),
    });
  }

  private async seguro<T>(fn: () => T | Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private async metricasTexto(res: http.ServerResponse): Promise<void> {
    res.writeHead(200, { 'Content-Type': this.metricas.registro.contentType });
    res.end(await this.metricas.registro.metrics());
  }

  private json(res: http.ServerResponse, estado: number, cuerpo: unknown): void {
    const texto = JSON.stringify(cuerpo);
    res.writeHead(estado, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(texto),
    });
    res.end(texto);
  }
}

/** Liveness remoto que usa el healthcheck del contenedor (y las pruebas locales). */
export async function verificarSalud(puerto: number, host = '127.0.0.1'): Promise<boolean> {
  try {
    const respuesta = await fetch(`http://${host}:${puerto}/health`, { signal: AbortSignal.timeout(2000) });
    return respuesta.ok;
  } catch {
    return false;
  }
}
