// HeinzGomez - Práctica 10: lectura centralizada de variables de entorno (SRP: un solo lugar lee process.env)
export interface Entorno {
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  rpcPrefetch: number;
  cuposPrefetch: number;
  /** Puerto del servidor de observabilidad (/health, /health/ready, /metrics). */
  puerto: number;
  /** Nivel de log estructurado (LOG_LEVEL). */
  logLevel: string;
}

const DEFECTO = {
  DATABASE_URL: 'postgres://academix:academix@localhost:5432/talleres_db',
  REDIS_URL: 'redis://localhost:6379',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672/',
  RPC_PREFETCH: '20',
  CUPOS_PREFETCH: '50',
  PUERTO: '8092',
  LOG_LEVEL: 'info',
};

export function leerEntorno(env: NodeJS.ProcessEnv = process.env): Entorno {
  const obtener = (clave: keyof typeof DEFECTO) => env[clave] ?? DEFECTO[clave];
  return {
    databaseUrl: obtener('DATABASE_URL'),
    redisUrl: obtener('REDIS_URL'),
    rabbitmqUrl: obtener('RABBITMQ_URL'),
    rpcPrefetch: Number(obtener('RPC_PREFETCH')),
    cuposPrefetch: Number(obtener('CUPOS_PREFETCH')),
    puerto: Number(obtener('PUERTO')),
    logLevel: obtener('LOG_LEVEL'),
  };
}
