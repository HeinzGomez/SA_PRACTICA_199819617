import express from "express";
import { closeDatabase, getDatabase } from "./config/database";
import { config } from "./config/environment";
import { GrpcServer } from "./grpc/server";
import { HealthRouter } from "./routes/health_routes";
import { UserController } from "./controller/user_controller";
import { SesionController } from "./controller/sesion_controller";
import { LogsController } from "./controller/logs_controller";
import { UserServiceImp } from "./services/user_services";
import { GoogleOAuthServiceImpl } from "./services/google-oauth_service";
import { OAuthStateServiceImpl } from "./services/oauth-state_service";
import { SesionServiceImp } from "./services/sesion_services";
import { LogsServiceImp } from "./services/logs_service";
import { PostgresUserRepository } from "./repositories/user_repository";
import { PostgresSesionRepository } from "./repositories/sesion_repository";
import { PostgresLogsRepository } from "./repositories/logs_repository";

const pool = getDatabase();

const userRepository = new PostgresUserRepository(pool);
const sesionRepository = new PostgresSesionRepository(pool);
const logsRepository = new PostgresLogsRepository(pool);

const userService = new UserServiceImp(userRepository);
const sesionService = new SesionServiceImp(sesionRepository, userRepository);
const logsService = new LogsServiceImp(logsRepository);
const googleOAuthService = new GoogleOAuthServiceImpl(config.google.clientId,config.google.clientSecret,config.google.redirectUri);

const oauthStateService = new OAuthStateServiceImpl(config.oauth.stateSecret);


const userController = new UserController(userService,googleOAuthService,oauthStateService,sesionService);
const sesionController = new SesionController(userService, sesionService);
const logsController = new LogsController(logsService);

const grpcServer = new GrpcServer(userController, sesionController, logsController);

const app = express();
app.use(express.json());
app.use(new HealthRouter(pool).router);

const httpServer = app.listen(config.server.httpPort, () => {
  console.log(
    `[HTTP] Servidor de autenticación escuchando en el puerto ${config.server.httpPort}`
  );
});

grpcServer.start().catch((error) => {
  console.error("[App] Error al iniciar el servidor gRPC:", error.message);
  process.exit(1);
});

function shutdown(): void {
  grpcServer.shutdown();
  httpServer.close();
  closeDatabase().then(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
