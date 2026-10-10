// HeinzGomez - Práctica 9: inicialización del API Gateway (HTTP :8080 -> bus de mensajes).
//
//   frontend -> Express -> routes/ -> rpc/ -> broker/ (exchange academix.rpc) -> <servicio>.rpc
import { Server } from 'node:http';
import { BusRpc } from './broker';
import { createApp } from './app';
import { leerEntorno } from './config';
import { crearServicios } from './rpc';

export function iniciar(): void {
  const entorno = leerEntorno();
  const bus = new BusRpc(entorno.rabbitmqUrl, entorno.rpcTimeoutMs);
  const app = createApp(crearServicios(bus), entorno);
  const servidor: Server = app.listen(entorno.puerto, () => {
    console.log(`api-gateway escuchando en :${entorno.puerto} (broker ${entorno.rabbitmqUrl})`);
  });
  registrarApagadoOrdenado(servidor, bus);
}

function registrarApagadoOrdenado(servidor: Server, bus: BusRpc): void {
  let cerrando = false;
  const cerrar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`[${senal}] cerrando api-gateway…`);
    servidor.close();
    await bus.cerrar();
    process.exit(0);
  };
  process.once('SIGTERM', () => void cerrar('SIGTERM'));
  process.once('SIGINT', () => void cerrar('SIGINT'));
}

if (require.main === module) {
  iniciar();
}
