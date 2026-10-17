// HeinzGomez - Práctica 9: productor RPC hacia talleres-service (cola `talleres.rpc`).
import { BusRpc } from '../broker';
import { TalleresRpc } from '../types';

const OPERACIONES = {
  listarEventos: 'talleres.listar_eventos',
  obtenerEvento: 'talleres.obtener_evento',
  obtenerCupos: 'talleres.obtener_cupos',
  crearEvento: 'talleres.crear_evento',
  actualizarEvento: 'talleres.actualizar_evento',
  eliminarEvento: 'talleres.eliminar_evento',
} as const;

export const crearTalleresRpc = (bus: BusRpc): TalleresRpc => ({
  listarEventos: (datos) => bus.enviar(OPERACIONES.listarEventos, datos),
  obtenerEvento: (datos) => bus.enviar(OPERACIONES.obtenerEvento, datos),
  obtenerCupos: (datos) => bus.enviar(OPERACIONES.obtenerCupos, datos),
  crearEvento: (datos) => bus.enviar(OPERACIONES.crearEvento, datos),
  actualizarEvento: (datos) => bus.enviar(OPERACIONES.actualizarEvento, datos),
  eliminarEvento: (datos) => bus.enviar(OPERACIONES.eliminarEvento, datos),
});
