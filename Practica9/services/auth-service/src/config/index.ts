// HeinzGomez - Práctica 9: composición de la configuración del servicio
import { ConfiguracionAuth } from '../types/auth';
import { Entorno } from './entorno';

export { leerEntorno } from './entorno';
export type { Entorno } from './entorno';
export { obtenerPool, cerrarPool } from './base-datos';
export { obtenerConexionBroker, iniciarConexionBroker, cerrarBroker } from './broker';
export { reintentar, dormir } from './reintentar';

export function crearConfiguracionAuth(entorno: Entorno): ConfiguracionAuth {
  return {
    jwtSecret: entorno.jwtSecret,
    jwtExpiresIn: entorno.jwtExpiresIn,
    dominiosPermitidos: entorno.dominiosPermitidos,
    bcryptRounds: entorno.bcryptRounds,
  };
}
