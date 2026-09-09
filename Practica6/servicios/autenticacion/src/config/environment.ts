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

export interface JwtConfig {
  secret: string;
  expiresMinutes: number;
}

export interface ServerConfig {
  grpcPort: number;
  httpPort: number;
}

export interface AppConfig {
  db: DatabaseConfig;
  jwt: JwtConfig;
  google: GoogleOAuthConfig;
  oauth: OAuthConfig;
  server: ServerConfig;
}


export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  allowedDomain: string;
}

export interface OAuthConfig {
  stateSecret: string;
}

export const config: AppConfig = {
  db: {
    host: required("AUTH_DB_HOST"),
    port: Number(required("AUTH_DB_PORT")),
    name: required("AUTH_DB_NAME"),
    user: required("AUTH_DB_USER"),
    pass: required("AUTH_DB_PASS"),
  },
  
  jwt: {
    secret: required("AUTH_JWT_SECRET"),
    expiresMinutes: Number(required("AUTH_JWT_EXPIRES")),
  },

  google: {
    clientId: required("AUTH_GOOGLE_CLIENT_ID"),
    clientSecret: required("AUTH_GOOGLE_CLIENT_SECRET"),
    redirectUri: required("AUTH_GOOGLE_REDIRECT_URI"),
    allowedDomain: optional(
      "AUTH_GOOGLE_ALLOWED_DOMAIN",
      "ingenieria.usac.edu.gt"
    ),
  },

  oauth: {
    stateSecret: required("AUTH_OAUTH_STATE_SECRET"),
  },

  server: {
    grpcPort: Number(required("AUTH_GRPC_PORT")),
    httpPort: Number(required("AUTH_HTTP_PORT")),
  },
};
