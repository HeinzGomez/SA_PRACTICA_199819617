// HeinzGomez - Práctica 10: conexión al broker RabbitMQ como singleton (con reconexión automática)
import { ConexionBroker } from '../broker/conexion';
import { Entorno } from './entorno';

let conexion: ConexionBroker | null = null;

/**
 * Devuelve la conexión compartida por el proceso.
 * `onEstado` se aplica solo en la primera creación: notifica cada cambio de conexión
 * para alimentar el gauge de broker y /health/ready.
 */
export function obtenerConexionBroker(entorno: Entorno, onEstado?: (conectado: boolean) => void): ConexionBroker {
  if (!conexion) conexion = new ConexionBroker(entorno.rabbitmqUrl, undefined, onEstado);
  return conexion;
}

/**
 * Arranca la conexión en segundo plano con reintentos: el servicio no depende de que
 * RabbitMQ esté listo para arrancar (los consumidores se suscriben cuando conecta).
 */
export function iniciarConexionBroker(entorno: Entorno, onEstado?: (conectado: boolean) => void): ConexionBroker {
  const broker = obtenerConexionBroker(entorno, onEstado);
  void broker.conectarConReintentos();
  return broker;
}

export async function cerrarBroker(): Promise<void> {
  if (!conexion) return;
  const actual = conexion;
  conexion = null;
  await actual.cerrar();
}
