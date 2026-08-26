import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarNotificacionesRequest,
  ConsultarNotificacionesResponse,
  EnviarNotificacionAvisoGeneralRequest,
  EnviarNotificacionAvisoGeneralResponse,
  EnviarNotificacionContenidoNuevoRequest,
  EnviarNotificacionContenidoNuevoResponse,
  EnviarNotificacionRegistroRequest,
  EnviarNotificacionRegistroResponse,
} from "../types/notificaciones.types";

const PROTO_FILE = "notificaciones.proto";

type NotificacionesGrpcObject = {
  notificaciones: {
    NotificacionesService: ServiceConstructor;
  };
};

export interface NotificacionesClient {
  enviarNotificacionRegistro(
    request: EnviarNotificacionRegistroRequest
  ): Promise<EnviarNotificacionRegistroResponse>;
  enviarNotificacionContenidoNuevo(
    request: EnviarNotificacionContenidoNuevoRequest
  ): Promise<EnviarNotificacionContenidoNuevoResponse>;
  enviarNotificacionAvisoGeneral(
    request: EnviarNotificacionAvisoGeneralRequest
  ): Promise<EnviarNotificacionAvisoGeneralResponse>;
  consultarNotificaciones(
    request: ConsultarNotificacionesRequest
  ): Promise<ConsultarNotificacionesResponse>;
  consultarAuditLogs(
    request: ConsultarAuditLogsRequest
  ): Promise<ConsultarAuditLogsResponse>;
}

export class NotificacionesGrpcClient
  extends GrpcBaseClient
  implements NotificacionesClient
{
  constructor(url: string = servicesConfig.notification.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as NotificacionesGrpcObject;
    return object.notificaciones.NotificacionesService;
  }

  enviarNotificacionRegistro(
    request: EnviarNotificacionRegistroRequest
  ): Promise<EnviarNotificacionRegistroResponse> {
    return this.unary<EnviarNotificacionRegistroResponse>(
      "EnviarNotificacionRegistro",
      request
    );
  }

  enviarNotificacionContenidoNuevo(
    request: EnviarNotificacionContenidoNuevoRequest
  ): Promise<EnviarNotificacionContenidoNuevoResponse> {
    return this.unary<EnviarNotificacionContenidoNuevoResponse>(
      "EnviarNotificacionContenidoNuevo",
      request
    );
  }

  enviarNotificacionAvisoGeneral(
    request: EnviarNotificacionAvisoGeneralRequest
  ): Promise<EnviarNotificacionAvisoGeneralResponse> {
    return this.unary<EnviarNotificacionAvisoGeneralResponse>(
      "EnviarNotificacionAvisoGeneral",
      request
    );
  }

  consultarNotificaciones(
    request: ConsultarNotificacionesRequest
  ): Promise<ConsultarNotificacionesResponse> {
    return this.unary<ConsultarNotificacionesResponse>(
      "ConsultarNotificaciones",
      request
    );
  }

  consultarAuditLogs(
    request: ConsultarAuditLogsRequest
  ): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>(
      "ConsultarAuditLogs",
      request
    );
  }
}
