// HeinzGomez - Práctica 9: lectura centralizada de variables de entorno del API Gateway
// (SRP: un solo archivo lee process.env; el resto del código recibe la configuración ya construida).

/** Opciones que necesita la capa HTTP (CORS, SSE, límite de reservas). */
export interface OpcionesApp {
  origenesPermitidos: string[];
  cupoStreamMs: number;
  limiteReservasPorMinuto: number;
}

/** Configuración completa del proceso: HTTP + transporte RPC sobre RabbitMQ. */
export interface Entorno extends OpcionesApp {
  puerto: number;
  rabbitmqUrl: string;
  rpcTimeoutMs: number;
}

const DEFECTO = {
  PORT: '8080',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672/',
  RPC_TIMEOUT_MS: '3000',
  CORS_ORIGINS: 'http://localhost:3000,*.vercel.app',
  CUPO_STREAM_MS: '2000',
  RESERVAS_POR_MINUTO: '20',
};

export function leerEntorno(env: NodeJS.ProcessEnv = process.env): Entorno {
  const obtener = (clave: keyof typeof DEFECTO) => env[clave] ?? DEFECTO[clave];
  return {
    puerto: Number(obtener('PORT')),
    rabbitmqUrl: obtener('RABBITMQ_URL'),
    rpcTimeoutMs: Number(obtener('RPC_TIMEOUT_MS')),
    origenesPermitidos: obtener('CORS_ORIGINS').split(',').map((o) => o.trim()).filter(Boolean),
    cupoStreamMs: Number(obtener('CUPO_STREAM_MS')),
    limiteReservasPorMinuto: Number(obtener('RESERVAS_POR_MINUTO')),
  };
}
