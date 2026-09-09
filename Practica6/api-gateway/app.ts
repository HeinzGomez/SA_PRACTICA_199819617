import express from "express";
import cookieParser from "cookie-parser";

import { AuthGrpcClient } from "./grpc/auth.client";
import { InscripcionGrpcClient } from "./grpc/ins.client";
import { GrabacionesGrpcClient } from "./grpc/grab.client";
import { HistorialGrpcClient } from "./grpc/his.client";
import { NotificacionesGrpcClient } from "./grpc/not.client";
import { AnaliticaGrpcClient } from "./grpc/anal.client";
import { RecursosGrpcClient } from "./grpc/res.client";

import { AuthMiddlewareImp } from "./middleware/auth.middleware";
import { RoleMiddlewareImp } from "./middleware/role.middleware";

import { AuthRoutes } from "./routes/auth.routes";
import { InsRoutes } from "./routes/ins.routes";
import { GrabRoutes } from "./routes/grab.routes";
import { HisRoutes } from "./routes/his.routes";
import { NotRoutes } from "./routes/not.routes";
import { AnalRoutes } from "./routes/anal.routes";
import { ResRoutes } from "./routes/res.routes";
import { servicesConfig } from "./config/services";
import { OAuthOnboardingServiceImp } from "./services/oauth-onboarding.service";

export function createApp(): express.Express {
  const app = express();


  app.use((req, res, next) => {
    const requestOrigin = String(req.headers.origin || "");
    const allowedOrigin = servicesConfig.frontend.httpurl;
    const originToSet = requestOrigin || allowedOrigin;

    // Debug log to help trace CORS issues in development
    console.log(`[CORS] requestOrigin=${requestOrigin} allowed=${allowedOrigin} using=${originToSet} method=${req.method} url=${req.url}`);

    res.setHeader("Access-Control-Allow-Origin", originToSet);

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.setHeader(
      "Access-Control-Allow-Credentials",
      "true"
    );

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json());

  app.use(cookieParser());

  const authClient = new AuthGrpcClient();
  const authMiddleware = new AuthMiddlewareImp(authClient);

  const insClient = new InscripcionGrpcClient();

  const roleMiddleware = new RoleMiddlewareImp(insClient);

  const notClient = new NotificacionesGrpcClient();

  const authRoutes = new AuthRoutes(
    authClient,
    authMiddleware,
    new OAuthOnboardingServiceImp(insClient, notClient),
    roleMiddleware
  );
  const insRoutes = new InsRoutes(insClient, authMiddleware, roleMiddleware);
  const grabClient = new GrabacionesGrpcClient();
  const grabRoutes = new GrabRoutes(grabClient, authMiddleware, roleMiddleware);

  const hisClient = new HistorialGrpcClient();
  const hisRoutes = new HisRoutes(hisClient, authMiddleware, roleMiddleware);

  const notRoutes = new NotRoutes(notClient, authMiddleware, roleMiddleware);

  const analClient = new AnaliticaGrpcClient();
  const analRoutes = new AnalRoutes(analClient, authMiddleware, roleMiddleware);

  const resClient = new RecursosGrpcClient();
  const resRoutes = new ResRoutes(resClient, authMiddleware, roleMiddleware);

  app.use("/auth", authRoutes.router);
  app.use("/ins", insRoutes.router);
  app.use("/grab", grabRoutes.router);
  app.use("/his", hisRoutes.router);
  app.use("/not", notRoutes.router);
  app.use("/anal", analRoutes.router);
  app.use("/res", resRoutes.router);

  return app;
}
