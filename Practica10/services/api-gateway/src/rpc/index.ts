// HeinzGomez - Práctica 9: composición de los productores RPC del API Gateway.
// Un archivo por servicio; cada uno solo conoce su cola y sus routing keys.
import { BusRpc } from '../broker';
import { Servicios } from '../types';
import { crearAuthRpc } from './auth';
import { crearCertificadosRpc } from './certificados';
import { crearReservasRpc } from './reservas';
import { crearTalleresRpc } from './talleres';

export function crearServicios(bus: BusRpc): Servicios {
  return {
    auth: crearAuthRpc(bus),
    talleres: crearTalleresRpc(bus),
    reservas: crearReservasRpc(bus),
    certificados: crearCertificadosRpc(bus),
  };
}
