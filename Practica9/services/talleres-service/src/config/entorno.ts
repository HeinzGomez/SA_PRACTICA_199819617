// HeinzGomez - Práctica 9: lectura centralizada de variables de entorno (SRP: un solo lugar lee process.env)
export interface Entorno {
  databaseUrl: string;
  redisUrl: string;
  rabbitmqUrl: string;
  rpcPrefetch: number;
  cuposPrefetch: number;
}

const DEFECTO = {
  DATABASE_URL: 'postgres://academix:academix@localhost:5432/talleres_db',
  REDIS_URL: 'redis://localhost:6379',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672/',
  RPC_PREFETCH: '20',
  CUPOS_PREFETCH: '50',
};

export function leerEntorno(env: NodeJS.ProcessEnv = process.env): Entorno {
  const obtener = (clave: keyof typeof DEFECTO) => env[clave] ?? DEFECTO[clave];
  return {
    databaseUrl: obtener('DATABASE_URL'),
    redisUrl: obtener('REDIS_URL'),
    rabbitmqUrl: obtener('RABBITMQ_URL'),
    rpcPrefetch: Number(obtener('RPC_PREFETCH')),
    cuposPrefetch: Number(obtener('CUPOS_PREFETCH')),
  };
}
