// HeinzGomez - Práctica 9: composición de las rutas del API Gateway.
// Un archivo por servicio; cada router traduce HTTP a las operaciones de `rpc/<servicio>.ts`.
import { Router } from 'express';
import { OpcionesApp } from '../config';
import { Servicios } from '../types';
import { crearRutasAuth } from './auth.routes';
import { crearRutasCertificados, crearRutasExamenes } from './certificados.routes';
import { crearRutasReservas } from './reservas.routes';
import { crearRutasEventos } from './talleres.routes';

export function crearRouter(s: Servicios, op: OpcionesApp): Router {
  const r = Router();
  r.use('/api/auth', crearRutasAuth(s));
  r.use('/api/eventos', crearRutasEventos(s, op));
  r.use('/api/reservas', crearRutasReservas(s, op));
  r.use('/api/examenes', crearRutasExamenes(s));
  r.use('/api/certificados', crearRutasCertificados(s));
  return r;
}

export { autenticar, envolver, httpStatus, manejarErrores, noEncontrado, soloRol } from './middleware';
