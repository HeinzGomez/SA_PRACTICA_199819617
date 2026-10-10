// HeinzGomez - Práctica 9: composición del API Gateway (composition root de la capa HTTP).
// No conoce el broker: solo monta middleware, rutas y el manejador de errores.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { OpcionesApp } from './config';
import { crearRouter, manejarErrores, noEncontrado } from './routes';
import { Servicios } from './types';

export function createApp(s: Servicios, op: OpcionesApp): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin: (origen, cb) => cb(null,
      !origen
      || op.origenesPermitidos.includes('*')
      || op.origenesPermitidos.some((p) => origen === p || (p.startsWith('*.') && origen.endsWith(p.slice(1))))),
  }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => { res.json({ status: 'ok', servicio: 'api-gateway' }); });

  app.use(crearRouter(s, op));
  app.use(noEncontrado);
  app.use(manejarErrores);

  return app;
}
