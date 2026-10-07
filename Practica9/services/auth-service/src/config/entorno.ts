// HeinzGomez - Práctica 9: lectura centralizada de variables de entorno (SRP: un solo lugar lee process.env)
export interface Entorno {
  databaseUrl: string;
  rabbitmqUrl: string;
  brokerPrefetch: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  dominiosPermitidos: string[];
  bcryptRounds: number;
  adminCorreo: string;
  adminPassword: string;
}

const DEFECTO = {
  DATABASE_URL: 'postgres://academix:academix@localhost:5432/auth_db',
  RABBITMQ_URL: 'amqp://guest:guest@localhost:5672/',
  JWT_SECRET: 'dev-secret-cambiar',
  JWT_EXPIRES_IN: '2h',
  ALLOWED_EMAIL_DOMAINS: 'ingenieria.usac.edu.gt,usac.edu.gt',
  BCRYPT_ROUNDS: '10',
  ADMIN_EMAIL: 'admin@ingenieria.usac.edu.gt',
  ADMIN_PASSWORD: 'Admin12345',
  BROKER_PREFETCH: '20',
};

export function leerEntorno(env: NodeJS.ProcessEnv = process.env): Entorno {
  const obtener = (clave: keyof typeof DEFECTO) => env[clave] ?? DEFECTO[clave];
  return {
    databaseUrl: obtener('DATABASE_URL'),
    rabbitmqUrl: obtener('RABBITMQ_URL'),
    brokerPrefetch: Number(obtener('BROKER_PREFETCH')),
    jwtSecret: obtener('JWT_SECRET'),
    jwtExpiresIn: obtener('JWT_EXPIRES_IN'),
    dominiosPermitidos: obtener('ALLOWED_EMAIL_DOMAINS').split(',').map((d) => d.trim()).filter(Boolean),
    bcryptRounds: Number(obtener('BCRYPT_ROUNDS')),
    adminCorreo: obtener('ADMIN_EMAIL'),
    adminPassword: obtener('ADMIN_PASSWORD'),
  };
}
