import "dotenv/config";

export const env = {
  grpcPort: Number(process.env.GRPC_PORT ?? 50051),
  db: {
    host: process.env.DB_HOST ?? "identity-db",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "identity_db",
    user: process.env.DB_USER ?? "identity_user",
    password: process.env.DB_PASSWORD ?? "identity_pass",
  },
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS ?? "ingenieria.usac.edu.gt,ing.usac.edu.gt")
    .split(",")
    .map((d) => d.trim().toLowerCase()),
};
