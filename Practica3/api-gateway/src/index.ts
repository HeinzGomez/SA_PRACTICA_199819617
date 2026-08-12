import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Seguridad basica de cabeceras HTTP
app.use(helmet());

// CORS restringido al origen del cliente web, con credenciales (Session Cookie)
app.use(
  cors({
    origin: env.webClientOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" })); // admite CSV codificados en base64 para la carga masiva
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

// Limite de tasa: protege el unico punto de entrada frente a picos de concurrencia
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Unico punto de entrada hacia los microservicios internos (traducido a gRPC)
app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api-gateway] listening on port ${env.port} (${env.nodeEnv})`);
});
