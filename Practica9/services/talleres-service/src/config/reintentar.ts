// HeinzGomez - Práctica 9: espera y reintentos para dependencias que arrancan en paralelo (Postgres, RabbitMQ)
export const dormir = (ms: number): Promise<void> => new Promise((resolver) => setTimeout(resolver, ms));

export async function reintentar<T>(
  nombre: string,
  fn: () => Promise<T>,
  intentos = 30,
  esperaMs = 2000,
): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await fn();
    } catch (e) {
      ultimoError = e;
      console.warn(`[${nombre}] intento ${intento}/${intentos} fallido: ${(e as Error).message}`);
      if (intento < intentos) await dormir(esperaMs);
    }
  }
  throw new Error(`${nombre} no disponible: ${(ultimoError as Error)?.message ?? 'error desconocido'}`);
}
