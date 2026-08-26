import fs from "fs";
import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { config } from "../config/environment";
import { UserController } from "../controller/user_controller";
import { SesionController } from "../controller/sesion_controller";
import { LogsController } from "../controller/logs_controller";

const PROTO_FILE = "autenticacion.proto";

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
    private userController: UserController,
    private sesionController: SesionController,
    private logsController: LogsController
  ) {
    this.server = new grpc.Server();
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const packageDefinition = protoLoader.loadSync(resolveProtoPath(), protoLoaderOptions);
      const grpcObject = grpc.loadPackageDefinition(packageDefinition) as any;

      this.server.addService(grpcObject.autenticacion.AutenticacionService.service, {
        RegistrarUsuario: this.userController.registrarUsuario.bind(this.userController),
        CambiarPassword: this.userController.cambiarPassword.bind(this.userController),
        ConsultarUsuario: this.userController.consultarUsuario.bind(this.userController),
        ConsultarUsuarios: this.userController.consultarUsuarios.bind(this.userController),
        CrearSesion: this.sesionController.crearSesion.bind(this.sesionController),
        CerrarSesion: this.sesionController.cerrarSesion.bind(this.sesionController),
        ValidarSesion: this.sesionController.validarSesion.bind(this.sesionController),
        ConsultarAuditLogs: this.logsController.consultarAuditLogs.bind(this.logsController),
        IniciarOAuthGoogle: this.userController.iniciarOAuthGoogle.bind(this.userController),
        AutenticarConGoogle: this.userController.autenticarConGoogle.bind(this.userController),
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
          console.log(`[gRPC] Servidor de autenticación escuchando en 0.0.0.0:${port}`);
          resolve();
        }
      );
    });
  }

  shutdown(): void {
    this.server.forceShutdown();
  }
}
