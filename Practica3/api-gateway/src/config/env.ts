import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: process.env.NODE_ENV ?? "development",

  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS ?? "ingenieria.usac.edu.gt,ing.usac.edu.gt")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),

  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  // @types/jsonwebtoken tipa "expiresIn" con el tipo StringValue de la
  // libreria "ms" (p.ej. "8h", "7d") en vez de "string" generico. La
  // variable de entorno siempre es un string valido en tiempo de
  // ejecucion; el cast solo satisface al compilador.
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as SignOptions["expiresIn"],

  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "yousac_session",
  sessionCookieSecure: (process.env.SESSION_COOKIE_SECURE ?? "true") === "true",
  sessionCookieHttpOnly: (process.env.SESSION_COOKIE_HTTPONLY ?? "true") === "true",

  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.OAUTH_CLIENT_SECRET ?? "",
    redirectUri: process.env.OAUTH_REDIRECT_URI ?? "http://localhost:8080/auth/oauth/callback",
    issuerUrl: process.env.OAUTH_ISSUER_URL ?? "",
  },

  grpc: {
    identityUrl: process.env.IDENTITY_SERVICE_GRPC_URL ?? "identity-service:50051",
    contentUrl: process.env.CONTENT_SERVICE_GRPC_URL ?? "content-service:50052",
    analyticsUrl: process.env.ANALYTICS_SERVICE_GRPC_URL ?? "analytics-service:50053",
  },

  webClientOrigin: process.env.WEB_CLIENT_ORIGIN ?? "http://localhost:5173",
};
