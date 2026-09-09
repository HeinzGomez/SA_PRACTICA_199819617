import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  ActualizarCheckpointRequest,
  ActualizarCheckpointResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarEstadisticasUsuarioRequest,
  ConsultarEstadisticasUsuarioResponse,
  ConsultarHistorialUsuarioRequest,
  ConsultarHistorialUsuarioResponse,
  EliminarHistorialClaseRequest,
  EliminarHistorialClaseResponse,
  MarcarClaseCompletadaRequest,
  MarcarClaseCompletadaResponse,
  ObtenerCheckpointClaseRequest,
  ObtenerCheckpointClaseResponse,
  RegistrarProgresoRequest,
  RegistrarProgresoResponse,
} from "../types/historial.types";

const PROTO_FILE = "historial.proto";

type HistorialGrpcObject = {
  historial: {
    HistorialService: ServiceConstructor;
  };
};

export interface HistorialClient {
  registrarProgreso(request: RegistrarProgresoRequest): Promise<RegistrarProgresoResponse>;
  actualizarCheckpoint(request: ActualizarCheckpointRequest): Promise<ActualizarCheckpointResponse>;
  marcarClaseCompletada(
    request: MarcarClaseCompletadaRequest
  ): Promise<MarcarClaseCompletadaResponse>;
  obtenerCheckpointClase(
    request: ObtenerCheckpointClaseRequest
  ): Promise<ObtenerCheckpointClaseResponse>;
  consultarHistorialUsuario(
    request: ConsultarHistorialUsuarioRequest
  ): Promise<ConsultarHistorialUsuarioResponse>;
  consultarEstadisticasUsuario(
    request: ConsultarEstadisticasUsuarioRequest
  ): Promise<ConsultarEstadisticasUsuarioResponse>;
  eliminarHistorialClase(
    request: EliminarHistorialClaseRequest
  ): Promise<EliminarHistorialClaseResponse>;
  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse>;
}

export class HistorialGrpcClient extends GrpcBaseClient implements HistorialClient {
  constructor(url: string = servicesConfig.history.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as HistorialGrpcObject;
    return object.historial.HistorialService;
  }

  registrarProgreso(request: RegistrarProgresoRequest): Promise<RegistrarProgresoResponse> {
    return this.unary<RegistrarProgresoResponse>("RegistrarProgreso", request);
  }

  actualizarCheckpoint(
    request: ActualizarCheckpointRequest
  ): Promise<ActualizarCheckpointResponse> {
    return this.unary<ActualizarCheckpointResponse>("ActualizarCheckpoint", request);
  }

  marcarClaseCompletada(
    request: MarcarClaseCompletadaRequest
  ): Promise<MarcarClaseCompletadaResponse> {
    return this.unary<MarcarClaseCompletadaResponse>("MarcarClaseCompletada", request);
  }

  obtenerCheckpointClase(
    request: ObtenerCheckpointClaseRequest
  ): Promise<ObtenerCheckpointClaseResponse> {
    return this.unary<ObtenerCheckpointClaseResponse>("ObtenerCheckpointClase", request);
  }

  consultarHistorialUsuario(
    request: ConsultarHistorialUsuarioRequest
  ): Promise<ConsultarHistorialUsuarioResponse> {
    return this.unary<ConsultarHistorialUsuarioResponse>("ConsultarHistorialUsuario", request);
  }

  consultarEstadisticasUsuario(
    request: ConsultarEstadisticasUsuarioRequest
  ): Promise<ConsultarEstadisticasUsuarioResponse> {
    return this.unary<ConsultarEstadisticasUsuarioResponse>("ConsultarEstadisticasUsuario", request);
  }

  eliminarHistorialClase(
    request: EliminarHistorialClaseRequest
  ): Promise<EliminarHistorialClaseResponse> {
    return this.unary<EliminarHistorialClaseResponse>("EliminarHistorialClase", request);
  }

  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>("ConsultarAuditLogs", request);
  }
}
