// HeinzGomez - Práctica 9: rutas de examen y diploma (CDU 3.4-3.7 y 4) -> rpc/certificados.ts
import { Router } from 'express';
import { Servicios } from '../types';
import { autenticar, envolver, soloRol } from './middleware';

/** Examen: consulta del estudiante y administración (crear examen / agregar preguntas). */
export function crearRutasExamenes(s: Servicios): Router {
  const r = Router();

  // Administración: el examen de la actividad, con sus respuestas (solo ADMINISTRADOR)
  r.get('/:eventoId/admin', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    res.json(await s.certificados.obtenerExamenAdmin({ evento_id: req.params.eventoId }));
  }));
  r.get('/:eventoId', autenticar(s), envolver(async (req, res) => {
    res.json(await s.certificados.obtenerExamen({ evento_id: req.params.eventoId, usuario_id: req.usuario!.id }));
  }));
  r.post('/:eventoId', autenticar(s), envolver(async (req, res) => {
    const respuestas = Object.entries(req.body?.respuestas ?? {})
      .map(([pregunta_id, opcion_id]) => ({ pregunta_id, opcion_id: String(opcion_id) }));
    res.json(await s.certificados.rendirExamen({ usuario_id: req.usuario!.id, evento_id: req.params.eventoId, respuestas }));
  }));

  // Administración (solo ADMINISTRADOR): el examen se crea por el broker, nunca por HTTP directo
  r.post('/', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    const { evento_id: eventoId, titulo } = req.body ?? {};
    if (!eventoId || !titulo) {
      res.status(400).json({ error: 'evento_id y titulo son obligatorios' });
      return;
    }
    res.status(201).json(await s.certificados.crearExamen(req.body));
  }));
  r.post('/:idExamen/preguntas', autenticar(s), soloRol('ADMINISTRADOR'), envolver(async (req, res) => {
    const idExamen = Number(req.params.idExamen);
    if (!Number.isInteger(idExamen) || idExamen <= 0 || !req.body?.enunciado || !Array.isArray(req.body?.opciones)) {
      res.status(400).json({ error: 'id_examen numérico, enunciado y opciones[] son obligatorios' });
      return;
    }
    res.status(201).json(await s.certificados.agregarPregunta({ ...req.body, id_examen: idExamen }));
  }));

  return r;
}

/** Diploma: emisión, consulta privada y verificación pública. */
export function crearRutasCertificados(s: Servicios): Router {
  const r = Router();

  r.post('/', autenticar(s), envolver(async (req, res) => {
    const eventoId = req.body?.evento_id;
    if (!eventoId) { res.status(400).json({ error: 'evento_id es obligatorio' }); return; }
    const evento = await s.talleres.obtenerEvento({ id: eventoId });
    res.status(201).json(await s.certificados.generarCertificado({
      usuario_id: req.usuario!.id, evento_id: eventoId, nombre_estudiante: req.usuario!.nombre,
      evento_titulo: evento.titulo, curso_codigo: evento.curso_codigo, curso_nombre: evento.curso_nombre,
    }));
  }));

  r.get('/', autenticar(s), envolver(async (req, res) => {
    const q = req.query as Record<string, string>;
    const lista = await s.certificados.listarCertificados({
      usuario_id: req.usuario!.id, curso_codigo: q.curso ?? '', fecha_desde: q.desde ?? '', fecha_hasta: q.hasta ?? '',
    });
    res.json(lista.certificados ?? []);
  }));

  // Verificación del diploma: acceso público (sin token)
  r.get('/verificar/:codigo', envolver(async (req, res) => {
    res.json(await s.certificados.verificarCertificado({ codigo: req.params.codigo }));
  }));

  return r;
}
