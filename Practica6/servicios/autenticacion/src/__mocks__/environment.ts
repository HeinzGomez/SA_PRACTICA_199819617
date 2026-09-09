export const config = {
  db: {
    host: "localhost",
    port: 5432,
    name: "test_db",
    user: "test",
    pass: "test",
  },
  jwt: {
    secret: "test-secret",
    expiresMinutes: 60,
  },
  google: {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "http://localhost:3000/callback",
    allowedDomain: "ingenieria.usac.edu.gt",
  },
  oauth: {
    stateSecret: "test-oauth-state-secret",
  },
  server: {
    grpcPort: 50051,
    httpPort: 3000,
  },
};
