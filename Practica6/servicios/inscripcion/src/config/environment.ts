function required(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`La variable de entorno '${key}' es requerida pero no está definida.`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  pass: string;
}

export interface ServerConfig {
  grpcPort: number;
  httpPort: number;
}

export interface AppConfig {
  db: DatabaseConfig;
  server: ServerConfig;
}

export const config: AppConfig = {
  db: {
    host: required("INS_DB_HOST"),
    port: Number(required("INS_DB_PORT")),
    name: required("INS_DB_NAME"),
    user: required("INS_DB_USER"),
    pass: required("INS_DB_PASS"),
  },
  server: {
    grpcPort: Number(required("INS_GRPC_PORT")),
    httpPort: Number(required("INS_HTTP_PORT")),
  },
};
