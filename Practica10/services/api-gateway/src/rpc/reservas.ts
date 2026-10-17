// HeinzGomez - Práctica 9: productor RPC hacia reservas-service (cola `reservas.rpc`).
import { BusRpc } from '../broker';
import { ReservasRpc } from '../types';

const OPERACIONES = {
  solicitar: 'reservas.solicitar',
  consultarTicket: 'reservas.consultar_ticket',
  listar: 'reservas.listar_usuario',
} as const;

export const crearReservasRpc = (bus: BusRpc): ReservasRpc => ({
  solicitarReserva: (datos) => bus.enviar(OPERACIONES.solicitar, datos),
  consultarTicket: (datos) => bus.enviar(OPERACIONES.consultarTicket, datos),
  listarReservasUsuario: (datos) => bus.enviar(OPERACIONES.listar, datos),
});
