// HeinzGomez - Práctica 9: composición de las rutas del API Gateway.
// Un archivo por servicio; cada router traduce HTTP a las operaciones de `rpc/<servicio>.ts`.
import { Router } from 'express';
import { OpcionesApp } from '../config';
import { guardarPrefijo } from '../observabilidad';
import { Servicios } from '../types';
import { crearRutasAuth } from './auth.routes';
import { crearRutasCertificados, crearRutasExamenes } from './certificados.routes';
import { crearRutasReservas } from './reservas.routes';
import { crearRutasEventos } from './talleres.routes';

export function crearRouter(s: Servicios, op: OpcionesApp): Router {
  const r = Router();
  r.use('/api/auth', guardarPrefijo, crearRutasAuth(s));
  r.use('/api/eventos', guardarPrefijo, crearRutasEventos(s, op));
  r.use('/api/reservas', guardarPrefijo, crearRutasReservas(s, op));
  r.use('/api/examenes', guardarPrefijo, crearRutasExamenes(s));
  r.use('/api/certificados', guardarPrefijo, crearRutasCertificados(s));
  return r;
}

export { autenticar, envolver, httpStatus, manejarErrores, noEncontrado, soloRol } from './middleware';
