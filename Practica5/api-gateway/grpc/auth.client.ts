import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  CambiarPasswordRequest,
  CambiarPasswordResponse,
  CerrarSesionRequest,
  CerrarSesionResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarUsuarioRequest,
  ConsultarUsuarioResponse,
  ConsultarUsuariosRequest,
  ConsultarUsuariosResponse,
  CrearSesionRequest,
  CrearSesionResponse,
  RegistrarUsuarioRequest,
  RegistrarUsuarioResponse,
  ValidarSesionRequest,
  ValidarSesionResponse,
  IniciarOAuthGoogleRequest,
  IniciarOAuthGoogleResponse,
  AutenticarConGoogleRequest,
  AutenticarConGoogleResponse,
} from "../types/auth.types";

const PROTO_FILE = "autenticacion.proto";

type AutenticacionGrpcObject = {
  autenticacion: {
    AutenticacionService: ServiceConstructor;
  };
};

export interface AuthClient {
  registrarUsuario(request: RegistrarUsuarioRequest): Promise<RegistrarUsuarioResponse>;
  crearSesion(request: CrearSesionRequest): Promise<CrearSesionResponse>;
  cerrarSesion(request: CerrarSesionRequest): Promise<CerrarSesionResponse>;
  validarSesion(request: ValidarSesionRequest): Promise<ValidarSesionResponse>;
  cambiarPassword(request: CambiarPasswordRequest): Promise<CambiarPasswordResponse>;
  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse>;
  consultarUsuario(request: ConsultarUsuarioRequest): Promise<ConsultarUsuarioResponse>;
  consultarUsuarios(request: ConsultarUsuariosRequest): Promise<ConsultarUsuariosResponse>;

  iniciarOAuthGoogle(request: IniciarOAuthGoogleRequest): Promise<IniciarOAuthGoogleResponse>;
  autenticarConGoogle(request: AutenticarConGoogleRequest): Promise<AutenticarConGoogleResponse>;
}

export class AuthGrpcClient extends GrpcBaseClient implements AuthClient {
  constructor(url: string = servicesConfig.auth.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as AutenticacionGrpcObject;
    return object.autenticacion.AutenticacionService;
  }

  registrarUsuario(request: RegistrarUsuarioRequest): Promise<RegistrarUsuarioResponse> {
    return this.unary<RegistrarUsuarioResponse>("RegistrarUsuario", request);
  }

  crearSesion(request: CrearSesionRequest): Promise<CrearSesionResponse> {
    return this.unary<CrearSesionResponse>("CrearSesion", request);
  }

  cerrarSesion(request: CerrarSesionRequest): Promise<CerrarSesionResponse> {
    return this.unary<CerrarSesionResponse>("CerrarSesion", request);
  }

  validarSesion(request: ValidarSesionRequest): Promise<ValidarSesionResponse> {
    return this.unary<ValidarSesionResponse>("ValidarSesion", request);
  }

  cambiarPassword(request: CambiarPasswordRequest): Promise<CambiarPasswordResponse> {
    return this.unary<CambiarPasswordResponse>("CambiarPassword", request);
  }

  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>("ConsultarAuditLogs", request);
  }

  consultarUsuario(request: ConsultarUsuarioRequest): Promise<ConsultarUsuarioResponse> {
    return this.unary<ConsultarUsuarioResponse>("ConsultarUsuario", request);
  }

  consultarUsuarios(request: ConsultarUsuariosRequest): Promise<ConsultarUsuariosResponse> {
    return this.unary<ConsultarUsuariosResponse>("ConsultarUsuarios", request);
  }

  iniciarOAuthGoogle(request: IniciarOAuthGoogleRequest): Promise<IniciarOAuthGoogleResponse> {
    return this.unary<IniciarOAuthGoogleResponse>("IniciarOAuthGoogle",request);
  }

  autenticarConGoogle(request: AutenticarConGoogleRequest): Promise<AutenticarConGoogleResponse> {
    return this.unary<AutenticarConGoogleResponse>("AutenticarConGoogle",request);
  }
}
