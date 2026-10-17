// HeinzGomez - Práctica 10: healthcheck del contenedor (Docker/K8s no traen curl; se usa el propio Node).
import { verificarSalud } from './servidor';

/** Código de salida 0 si el proceso responde en /health; 1 en caso contrario (liveness). */
export async function codigoDeSalida(puerto = Number(process.env.PUERTO ?? 8091)): Promise<number> {
  return (await verificarSalud(puerto)) ? 0 : 1;
}

if (require.main === module) {
  void codigoDeSalida().then((codigo) => process.exit(codigo));
}
