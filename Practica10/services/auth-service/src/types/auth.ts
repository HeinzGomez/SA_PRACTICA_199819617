// HeinzGomez - Práctica 9: contratos de entrada/salida del Servicio de Autenticación
import { Usuario } from './usuario';

export interface RegistroInput {
  nombre: string;
  carnet: string;
  correo: string;
  password: string;
}

export interface Credenciales {
  correo: string;
  password: string;
}

export interface SolicitudValidacion {
  token: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface ResultadoValidacion {
  valido: boolean;
  usuario?: Usuario;
}

export interface ConfiguracionAuth {
  jwtSecret: string;
  jwtExpiresIn: string;
  dominiosPermitidos: string[];
  bcryptRounds: number;
}
