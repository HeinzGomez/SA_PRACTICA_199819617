// HeinzGomez - Práctica 9: conexión al broker RabbitMQ como singleton (con reconexión automática)
import { ConexionBroker } from '../broker/conexion';
import { Entorno } from './entorno';

let conexion: ConexionBroker | null = null;

/** Devuelve la conexión compartida por el proceso. */
export function obtenerConexionBroker(entorno: Entorno): ConexionBroker {
  if (!conexion) conexion = new ConexionBroker(entorno.rabbitmqUrl);
  return conexion;
}

/**
 * Arranca la conexión en segundo plano con reintentos: el servicio no depende de que
 * RabbitMQ esté listo para arrancar (los consumidores se suscriben cuando conecta).
 */
export function iniciarConexionBroker(entorno: Entorno): ConexionBroker {
  const broker = obtenerConexionBroker(entorno);
  void broker.conectarConReintentos();
  return broker;
}

export async function cerrarBroker(): Promise<void> {
  if (!conexion) return;
  const actual = conexion;
  conexion = null;
  await actual.cerrar();
}
