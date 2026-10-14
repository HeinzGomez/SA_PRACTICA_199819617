// HeinzGomez - Práctica 10: composición del API Gateway (composition root de la capa HTTP).
// No conoce el broker: solo monta observabilidad, middleware, rutas de salud/métricas y el manejador de errores.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { OpcionesApp } from './config';
import { Observabilidad, logPeticiones, loggerPorDefecto, metricasPorDefecto } from './observabilidad';
import { crearRouter, envolver, manejarErrores, noEncontrado } from './routes';
import { Servicios } from './types';

const VERSION = process.env.SERVICE_VERSION ?? '1.0.0';

const sello = () => ({
  servicio: 'api-gateway',
  version: VERSION,
  uptime_s: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

export function createApp(s: Servicios, op: OpcionesApp, obs: Observabilidad = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(logPeticiones(obs.log ?? loggerPorDefecto()));
  app.use(helmet());
  app.use(cors({
    origin: (origen, cb) => cb(null,
      !origen
      || op.origenesPermitidos.includes('*')
      || op.origenesPermitidos.some((p) => origen === p || (p.startsWith('*.') && origen.endsWith(p.slice(1))))),
  }));
  app.use(express.json({ limit: '100kb' }));

  const metricas = obs.metricas ?? metricasPorDefecto();
  app.use(metricas.middleware);

  // Liveness: el proceso responde. Es el healthcheck de Docker/Kubernetes (no depende del broker).
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ...sello() });
  });

  // Readiness: además de vivo, el bus de mensajes debe ser alcanzable (readinessProbe de K3s).
  app.get('/health/ready', envolver(async (_req, res) => {
    let broker = 'no-verificado';
    let listo = true;
    if (obs.verificarBroker) {
      listo = await obs.verificarBroker().catch(() => false);
      broker = listo ? 'ok' : 'down';
    }
    res.status(listo ? 200 : 503).json({ status: listo ? 'ready' : 'not_ready', broker, ...sello() });
  }));

  // Scraping de Prometheus (interno al clúster / red de compose).
  app.get('/metrics', envolver(async (_req, res) => {
    res.set('Content-Type', metricas.registro.contentType);
    res.end(await metricas.registro.metrics());
  }));

  app.use(crearRouter(s, op));
  app.use(noEncontrado);
  app.use(manejarErrores);

  return app;
}
