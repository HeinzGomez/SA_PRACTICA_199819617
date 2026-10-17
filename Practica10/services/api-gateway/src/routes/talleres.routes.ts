// HeinzGomez - Práctica 9: rutas del catálogo de eventos (CDU 2) -> rpc/talleres.ts
import { Router } from 'express';
import { OpcionesApp } from '../config';
import { Servicios } from '../types';
import { autenticar, envolver, soloRol } from './middleware';

export function crearRutasEventos(s: Servicios, op: OpcionesApp): Router {
  const r = Router();

  // El orden importa: /cupos y /cupos/stream deben ir antes de /:id
  r.get('/', envolver(async (req, res) => {
    const q = req.query as Record<string, string>;
    const lista = await s.talleres.listarEventos({
      curso_codigo: q.curso ?? '', fecha_desde: q.desde ?? '', fecha_hasta: q.hasta ?? '', tipo: q.tipo ?? '',
    });
    res.json(lista.eventos ?? []);
  }));

  r.get('/cupos', envolver(async (req, res) => {
    const ids = String(req.query.ids ?? '').split(',').filter(Boolean);
    res.json((await s.talleres.obtenerCupos({ evento_ids: ids })).cupos ?? []);
  }));

  // CDU 2.4: cupo en tiempo real vía Server-Sent Events
  r.get('/cupos/stream', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    const enviar = () => s.talleres.obtenerCupos({ evento_ids: [] })
      .then((x) => res.write(`event: cupos\ndata: ${JSON.stringify(x.cupos ?? [])}\n\n`))
      .catch(() => res.write('event: error\ndata: {}\n\n'));
    enviar();
    const temporizador = setInterval(enviar, op.cupoStreamMs);
    req.on('close', () => clearInterval(temporizador));
  });

  r.get('/:id', envolver(async (req, res) => {
    res.json(await s.talleres.obtenerEvento({ id: req.params.id }));
  }));

  r.post('/', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    res.status(201).json(await s.talleres.crearEvento(req.body ?? {}));
  }));
  r.put('/:id', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    res.json(await s.talleres.actualizarEvento({ ...(req.body ?? {}), id: req.params.id }));
  }));
  r.delete('/:id', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    await s.talleres.eliminarEvento({ id: req.params.id });
    res.status(204).end();
  }));

  return r;
}
