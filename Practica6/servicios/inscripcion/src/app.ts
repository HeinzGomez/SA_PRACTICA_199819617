import express from "express";
import { closeDatabase, getDatabase } from "./config/database";
import { config } from "./config/environment";
import { GrpcServer } from "./grpc/server";
import { HealthRouter } from "./routes/health_routes";
import { AcademicoController } from "./controller/academico_controller";
import { CursoController } from "./controller/curso_controller";
import { InscribirController } from "./controller/inscribir_controller";
import { LogsController } from "./controller/logs_controller";
import { RolController } from "./controller/rol_controller";
import { AcademicoServiceImp } from "./services/academico_service";
import { CursoServiceImp } from "./services/curso_services";
import { InscribirServiceImp } from "./services/inscribir_service";
import { LogsServiceImp } from "./services/log_service";
import { RolServiceImp } from "./services/rol_service";
import { PostgresAcademicoRepository } from "./repositories/academico_repository";
import { PostgresCursoRepository } from "./repositories/curso_repository";
import { PostgresInscribirRepository } from "./repositories/inscribir_repository";
import { PostgresLogsRepository } from "./repositories/logs_repository";
import { PostgresRolRepository } from "./repositories/rol_repository";

const pool = getDatabase();

const cursoRepository = new PostgresCursoRepository(pool);
const academicoRepository = new PostgresAcademicoRepository(pool);
const rolRepository = new PostgresRolRepository(pool);
const inscribirRepository = new PostgresInscribirRepository(pool);
const logsRepository = new PostgresLogsRepository(pool);

const cursoService = new CursoServiceImp(cursoRepository);
const academicoService = new AcademicoServiceImp(academicoRepository, rolRepository);
const rolService = new RolServiceImp(rolRepository);
const inscribirService = new InscribirServiceImp(inscribirRepository, cursoRepository);
const logsService = new LogsServiceImp(logsRepository);

const cursoController = new CursoController(cursoService);
const academicoController = new AcademicoController(academicoService);
const rolController = new RolController(rolService);
const inscribirController = new InscribirController(inscribirService);
const logsController = new LogsController(logsService);

const grpcServer = new GrpcServer(
  cursoController,
  academicoController,
  rolController,
  inscribirController,
  logsController
);

const app = express();
app.use(express.json());
app.use(new HealthRouter(pool).router);

const httpServer = app.listen(config.server.httpPort, () => {
  console.log(
    `[HTTP] Servidor de inscripción escuchando en el puerto ${config.server.httpPort}`
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
