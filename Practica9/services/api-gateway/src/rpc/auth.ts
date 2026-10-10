// HeinzGomez - Práctica 9: productor RPC hacia auth-service (cola `auth.rpc`).
import { BusRpc } from '../broker';
import { AuthRpc } from '../types';

const OPERACIONES = {
  registro: 'auth.register',
  login: 'auth.login',
  validacion: 'auth.validate_token',
} as const;

export const crearAuthRpc = (bus: BusRpc): AuthRpc => ({
  registro: (datos) => bus.enviar(OPERACIONES.registro, datos),
  login: (datos) => bus.enviar(OPERACIONES.login, datos),
  validarToken: (datos) => bus.enviar(OPERACIONES.validacion, datos),
});
