// HeinzGomez - Práctica 7: API Gateway REST (contrato consumido por el frontend en Vercel).
// Traduce HTTP/JSON a llamadas gRPC hacia los servicios SOA. La reserva responde 202 (asíncrona).
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OpcionesApp, Servicios, UsuarioSesion } from './types';

declare module 'express-serve-static-core' {
  interface Request { usuario?: UsuarioSesion }
}

// Códigos gRPC -> HTTP
const HTTP_DE_GRPC: Record<number, number> = {
  3: 400, // INVALID_ARGUMENT
  5: 404, // NOT_FOUND
  6: 409, // ALREADY_EXISTS
  7: 403, // PERMISSION_DENIED
  8: 429, // RESOURCE_EXHAUSTED
  9: 409, // FAILED_PRECONDITION
  14: 503, // UNAVAILABLE
  16: 401, // UNAUTHENTICATED
};

export function httpStatus(err: any): number {
  return typeof err?.code === 'number' ? HTTP_DE_GRPC[err.code] ?? 500 : 500;
}

const h = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

const TIPOS_RESERVA = ['ACREDITACION', 'EXAMEN_CERTIFICACION'];

export function createApp(s: Servicios, op: OpcionesApp) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: (o, cb) => cb(null, !o || op.origenesPermitidos.includes('*') || op.origenesPermitidos.some((p) => o === p || (p.startsWith('*.') && o.endsWith(p.slice(1))))) }));
  app.use(express.json({ limit: '100kb' }));

  const auth = (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!token) { res.status(401).json({ error: 'Token requerido' }); return; }
    s.auth.ValidateToken({ token }).then((r) => {
      if (!r?.valido) { res.status(401).json({ error: 'Token inválido o expirado' }); return; }
      req.usuario = r.usuario;
      next();
    }).catch(next);
  };
  const soloRol = (rol: UsuarioSesion['rol']) => (req: Request, res: Response, next: NextFunction) =>
    req.usuario?.rol === rol ? next() : res.status(403).json({ error: `Requiere rol ${rol}` });

  app.get('/health', (_req, res) => { res.json({ status: 'ok', servicio: 'api-gateway' }); });

  // ---------- CDU 1: autenticación
  app.post('/api/auth/register', h(async (req, res) => { res.status(201).json(await s.auth.Register(req.body ?? {})); }));
  app.post('/api/auth/login', h(async (req, res) => { res.json(await s.auth.Login(req.body ?? {})); }));
  app.get('/api/auth/me', auth, (req, res) => { res.json(req.usuario); });

  // ---------- CDU 2: catálogo (público) y administración
  app.get('/api/eventos', h(async (req, res) => {
    const q = req.query as Record<string, string>;
    const r = await s.talleres.ListarEventos({ curso_codigo: q.curso ?? '', fecha_desde: q.desde ?? '', fecha_hasta: q.hasta ?? '', tipo: q.tipo ?? '' });
    res.json(r.eventos ?? []);
  }));
  app.get('/api/eventos/cupos', h(async (req, res) => {
    const ids = String(req.query.ids ?? '').split(',').filter(Boolean);
    res.json((await s.talleres.ObtenerCupos({ evento_ids: ids })).cupos ?? []);
  }));
  // CDU 2.4: cupo en tiempo real vía Server-Sent Events
  app.get('/api/eventos/cupos/stream', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    const enviar = () => s.talleres.ObtenerCupos({ evento_ids: [] })
      .then((r) => res.write(`event: cupos\ndata: ${JSON.stringify(r.cupos ?? [])}\n\n`))
      .catch(() => res.write('event: error\ndata: {}\n\n'));
    enviar();
    const t = setInterval(enviar, op.cupoStreamMs);
    req.on('close', () => clearInterval(t));
  });
  app.get('/api/eventos/:id', h(async (req, res) => { res.json(await s.talleres.ObtenerEvento({ id: req.params.id })); }));
  app.post('/api/eventos', auth, soloRol('ADMINISTRADOR'), h(async (req, res) => {
    res.status(201).json(await s.talleres.CrearEvento(req.body ?? {}));
  }));
  app.put('/api/eventos/:id', auth, soloRol('ADMINISTRADOR'), h(async (req, res) => {
    res.json(await s.talleres.ActualizarEvento({ ...(req.body ?? {}), id: req.params.id }));
  }));
  app.delete('/api/eventos/:id', auth, soloRol('ADMINISTRADOR'), h(async (req, res) => {
    await s.talleres.EliminarEvento({ id: req.params.id });
    res.status(204).end();
  }));

  // ---------- CDU 3.1-3.3: reserva asíncrona (productor -> RabbitMQ)
  const limiteReservas = rateLimit({
    windowMs: 60_000, limit: op.limiteReservasPorMinuto, standardHeaders: 'draft-7', legacyHeaders: false,
    keyGenerator: (req) => req.usuario?.id ?? req.ip ?? 'anon',
    message: { error: 'Demasiadas solicitudes de reserva, intente en un minuto' },
  });
  app.post('/api/reservas', auth, soloRol('ESTUDIANTE'), limiteReservas, h(async (req, res) => {
    const { evento_id: eventoId, tipo = 'ACREDITACION' } = req.body ?? {};
    if (!eventoId || !TIPOS_RESERVA.includes(tipo)) {
      res.status(400).json({ error: `evento_id es obligatorio y tipo debe ser ${TIPOS_RESERVA.join('|')}` });
      return;
    }
    await s.talleres.ObtenerEvento({ id: eventoId }); // 404 si no existe
    const ticket = await s.reservas.SolicitarReserva({ usuario_id: req.usuario!.id, evento_id: eventoId, tipo });
    res.status(202).location(`/api/reservas/${ticket.id}`).json(ticket);
  }));
  app.get('/api/reservas', auth, h(async (req, res) => {
    res.json((await s.reservas.ListarReservasUsuario({ id: req.usuario!.id })).tickets ?? []);
  }));
  app.get('/api/reservas/:ticketId', auth, h(async (req, res) => {
    const t = await s.reservas.ConsultarTicket({ id: req.params.ticketId });
    if (t.usuario_id !== req.usuario!.id && req.usuario!.rol !== 'ADMINISTRADOR') {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    res.json(t);
  }));

  // ---------- CDU 3.4-3.7: examen y emisión de diploma
  app.get('/api/examenes/:eventoId', auth, h(async (req, res) => {
    res.json(await s.certificados.ObtenerExamen({ evento_id: req.params.eventoId, usuario_id: req.usuario!.id }));
  }));
  app.post('/api/examenes/:eventoId', auth, h(async (req, res) => {
    const respuestas = Object.entries(req.body?.respuestas ?? {}).map(([pregunta_id, opcion_id]) => ({ pregunta_id, opcion_id }));
    res.json(await s.certificados.RendirExamen({ usuario_id: req.usuario!.id, evento_id: req.params.eventoId, respuestas }));
  }));
  app.post('/api/certificados', auth, h(async (req, res) => {
    const eventoId = req.body?.evento_id;
    if (!eventoId) { res.status(400).json({ error: 'evento_id es obligatorio' }); return; }
    const ev = await s.talleres.ObtenerEvento({ id: eventoId });
    res.status(201).json(await s.certificados.GenerarCertificado({
      usuario_id: req.usuario!.id, evento_id: eventoId, nombre_estudiante: req.usuario!.nombre,
      evento_titulo: ev.titulo, curso_codigo: ev.curso_codigo, curso_nombre: ev.curso_nombre,
    }));
  }));

  // ---------- CDU 4: consulta (privada) y verificación (pública)
  app.get('/api/certificados', auth, h(async (req, res) => {
    const q = req.query as Record<string, string>;
    const r = await s.certificados.ListarCertificados({ usuario_id: req.usuario!.id, curso_codigo: q.curso ?? '', fecha_desde: q.desde ?? '', fecha_hasta: q.hasta ?? '' });
    res.json(r.certificados ?? []);
  }));
  app.get('/api/certificados/verificar/:codigo', h(async (req, res) => {
    res.json(await s.certificados.VerificarCertificado({ codigo: req.params.codigo }));
  }));

  app.use((_req, res) => { res.status(404).json({ error: 'Ruta no encontrada' }); });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = httpStatus(err);
    const genericos: Record<number, string> = { 500: 'Error interno', 503: 'Servicio temporalmente no disponible, intente de nuevo' };
    res.status(status).json({ error: genericos[status] ?? err.details ?? err.message });
  });
  return app;
}
