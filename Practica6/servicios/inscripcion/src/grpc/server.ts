import fs from "fs";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { config } from "../config/environment";
import { AcademicoController } from "../controller/academico_controller";
import { CursoController } from "../controller/curso_controller";
import { InscribirController } from "../controller/inscribir_controller";
import { LogsController } from "../controller/logs_controller";
import { RolController } from "../controller/rol_controller";

const PROTO_FILE = "inscripcion.proto";

function resolveProtoPath(): string {
  let dir = __dirname;
  while (dir !== path.parse(dir).root) {
    const candidate = path.join(dir, "contratos", PROTO_FILE);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`No se encontró 'contratos/${PROTO_FILE}'`);
}

const protoLoaderOptions: protoLoader.Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export class GrpcServer {
  private server: grpc.Server;

  constructor(
    private cursoController: CursoController,
    private academicoController: AcademicoController,
    private rolController: RolController,
    private inscribirController: InscribirController,
    private logsController: LogsController
  ) {
    this.server = new grpc.Server();
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const packageDefinition = protoLoader.loadSync(resolveProtoPath(), protoLoaderOptions);
      const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;

      this.server.addService(grpcObject.inscripcion.InscripcionService.service, {
        CrearArea: this.cursoController.crearArea.bind(this.cursoController),
        EditarArea: this.cursoController.editarArea.bind(this.cursoController),
        EliminarArea: this.cursoController.eliminarArea.bind(this.cursoController),
        CrearCurso: this.cursoController.crearCurso.bind(this.cursoController),
        EditarCurso: this.cursoController.editarCurso.bind(this.cursoController),
        EliminarCurso: this.cursoController.eliminarCurso.bind(this.cursoController),
        ConsultarAreas: this.cursoController.consultarAreas.bind(this.cursoController),
        ConsultarCursos: this.cursoController.consultarCursos.bind(this.cursoController),
        CrearPensum: this.academicoController.crearPensum.bind(this.academicoController),
        EditarPensum: this.academicoController.editarPensum.bind(this.academicoController),
        EliminarPensum: this.academicoController.eliminarPensum.bind(this.academicoController),
        ConsultarPensums: this.academicoController.consultarPensums.bind(
          this.academicoController
        ),
        CrearCarrera: this.academicoController.crearCarrera.bind(this.academicoController),
        EditarCarrera: this.academicoController.editarCarrera.bind(this.academicoController),
        EliminarCarrera: this.academicoController.eliminarCarrera.bind(this.academicoController),
        ConsultarCarreras: this.academicoController.consultarCarreras.bind(
          this.academicoController
        ),
        CrearPeriodo: this.academicoController.crearPeriodo.bind(this.academicoController),
        EditarPeriodo: this.academicoController.editarPeriodo.bind(this.academicoController),
        EliminarPeriodo: this.academicoController.eliminarPeriodo.bind(
          this.academicoController
        ),
        ConsultarPeriodos: this.academicoController.consultarPeriodos.bind(
          this.academicoController
        ),
        CrearPerfilAcademico: this.academicoController.crearPerfilAcademico.bind(
          this.academicoController
        ),
        CambiarPerfilAcademico: this.academicoController.cambiarPerfilAcademico.bind(
          this.academicoController
        ),
        ConsultarPerfilAcademico: this.academicoController.consultarPerfilAcademico.bind(
          this.academicoController
        ),
        ConsultarPerfilesEstudiante: this.academicoController.consultarPerfilesEstudiante.bind(
          this.academicoController
        ),
        AsignarRolUsuario: this.rolController.asignarRol.bind(this.rolController),
        CambiarRolUsuario: this.rolController.cambiarRol.bind(this.rolController),
        EliminarRolUsuario: this.rolController.eliminarRol.bind(this.rolController),
        ComprobarRolUsuario: this.rolController.comprobarRol.bind(this.rolController),
        ConsultarRolesUsuario: this.rolController.consultarRolesUsuario.bind(
          this.rolController
        ),
        InscribirEstudiante: this.inscribirController.inscribirEstudiante.bind(
          this.inscribirController
        ),
        ActualizarEstadoMatricula: this.inscribirController.actualizarEstadoMatricula.bind(
          this.inscribirController
        ),
        ConsultarCursosEstudiante: this.inscribirController.consultarCursosEstudiante.bind(
          this.inscribirController
        ),
        ConsultarEstadosMatricula: this.inscribirController.consultarEstadosMatricula.bind(
          this.inscribirController
        ),
        ConsultarTodasInscripciones: this.inscribirController.consultarTodasInscripciones.bind(
          this.inscribirController
        ),
        ConsultarAuditLogs: this.logsController.consultarAuditLogs.bind(this.logsController),
      });

      this.server.bindAsync(
        `0.0.0.0:${config.server.grpcPort}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            reject(error);
            return;
          }
          this.server.start();
          console.log(`[gRPC] Servidor de inscripción escuchando en 0.0.0.0:${port}`);
          resolve();
        }
      );
    });
  }

  shutdown(): void {
    this.server.forceShutdown();
  }
}
