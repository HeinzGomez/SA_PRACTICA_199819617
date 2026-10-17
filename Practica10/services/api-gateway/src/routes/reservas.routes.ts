// HeinzGomez - Práctica 10: rutas de reserva asíncrona (CDU 3.1-3.3) -> rpc/reservas.ts
import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { OpcionesApp } from '../config';
import { Servicios } from '../types';
import { autenticar, envolver, soloRol } from './middleware';

const TIPOS_RESERVA = ['ACREDITACION', 'EXAMEN_CERTIFICACION'];

export function crearRutasReservas(s: Servicios, op: OpcionesApp): Router {
  const r = Router();

  const limiteReservas = rateLimit({
    windowMs: 60_000,
    limit: op.limiteReservasPorMinuto,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.usuario?.id ?? req.ip ?? 'anon',
    message: { error: 'Demasiadas solicitudes de reserva, intente en un minuto' },
  });

  // El simulador de ráfaga corre autenticado como administrador: se le permite reservar
  // (el cupo sigue protegido por el descuento atómico en Redis) y se le exime del límite
  // por minuto, que protege al estudiante normal.
  const rolReserva = (req: Request, res: Response, next: NextFunction): void => {
    if (req.usuario?.rol === 'ADMINISTRADOR') { next(); return; }
    soloRol('ESTUDIANTE')(req, res, next);
  };
  const limiteSiEstudiante = (req: Request, res: Response, next: NextFunction): void => {
    if (req.usuario?.rol === 'ADMINISTRADOR') { next(); return; }
    limiteReservas(req, res, next);
  };

  r.post('/', autenticar(s), rolReserva, limiteSiEstudiante, envolver(async (req, res) => {
    const { evento_id: eventoId, tipo = 'ACREDITACION' } = req.body ?? {};
    if (!eventoId || !TIPOS_RESERVA.includes(tipo)) {
      res.status(400).json({ error: `evento_id es obligatorio y tipo debe ser ${TIPOS_RESERVA.join('|')}` });
      return;
    }
    await s.talleres.obtenerEvento({ id: eventoId }); // 404 si no existe
    const ticket = await s.reservas.solicitarReserva({ usuario_id: req.usuario!.id, evento_id: eventoId, tipo });
    res.status(202).location(`/api/reservas/${ticket.id}`).json(ticket);
  }));

  r.get('/', autenticar(s), envolver(async (req, res) => {
    res.json((await s.reservas.listarReservasUsuario({ id: req.usuario!.id })).tickets ?? []);
  }));

  r.get('/:ticketId', autenticar(s), envolver(async (req, res) => {
    const ticket = await s.reservas.consultarTicket({ id: req.params.ticketId });
    if (ticket.usuario_id !== req.usuario!.id && req.usuario!.rol !== 'ADMINISTRADOR') {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    res.json(ticket);
  }));

  return r;
}
