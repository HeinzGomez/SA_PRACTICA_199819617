import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  AsignarTemaClaseGrabadaRequest,
  AsignarTemaClaseGrabadaResponse,
  BatchCrearClaseRequest,
  BatchCrearClaseResponse,
  CalificarClaseRequest,
  CalificarClaseResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarCalificacionUsuarioRequest,
  ConsultarCalificacionUsuarioResponse,
  ConsultarCatalogoClasesRequest,
  ConsultarCatalogoClasesResponse,
  ConsultarClasesMasVistasRequest,
  ConsultarClasesMasVistasResponse,
  ConsultarRankingValoradasRequest,
  ConsultarRankingValoradasResponse,
  ConsultarTemasRequest,
  ConsultarTemasResponse,
  ConsultarTemasTendenciaRequest,
  ConsultarTemasTendenciaResponse,
  ConsultarUnidadesRequest,
  ConsultarUnidadesResponse,
  CrearClaseGrabadaRequest,
  CrearClaseGrabadaResponse,
  CrearTemaRequest,
  CrearTemaResponse,
  CrearUnidadRequest,
  CrearUnidadResponse,
  DesasignarTemaClaseGrabadaRequest,
  DesasignarTemaClaseGrabadaResponse,
  EditarClaseGrabadaRequest,
  EditarClaseGrabadaResponse,
  EditarTemaRequest,
  EditarTemaResponse,
  EditarUnidadRequest,
  EditarUnidadResponse,
  EliminarClaseGrabadaRequest,
  EliminarClaseGrabadaResponse,
  EliminarTemaRequest,
  EliminarTemaResponse,
  EliminarUnidadRequest,
  EliminarUnidadResponse,
  VisualizarClaseRequest,
  VisualizarClaseResponse,
} from "../types/analitica.types";

const PROTO_FILE = "analisis.proto";

type AnalisisGrpcObject = {
  analisis: {
    AnalisisService: ServiceConstructor;
  };
};

export interface AnaliticaClient {
  crearUnidad(request: CrearUnidadRequest): Promise<CrearUnidadResponse>;
  editarUnidad(request: EditarUnidadRequest): Promise<EditarUnidadResponse>;
  eliminarUnidad(request: EliminarUnidadRequest): Promise<EliminarUnidadResponse>;
  consultarUnidades(
    request: ConsultarUnidadesRequest
  ): Promise<ConsultarUnidadesResponse>;
  crearTema(request: CrearTemaRequest): Promise<CrearTemaResponse>;
  editarTema(request: EditarTemaRequest): Promise<EditarTemaResponse>;
  eliminarTema(request: EliminarTemaRequest): Promise<EliminarTemaResponse>;
  consultarTemas(request: ConsultarTemasRequest): Promise<ConsultarTemasResponse>;
  crearClaseGrabada(
    request: CrearClaseGrabadaRequest
  ): Promise<CrearClaseGrabadaResponse>;
  editarClaseGrabada(
    request: EditarClaseGrabadaRequest
  ): Promise<EditarClaseGrabadaResponse>;
  eliminarClaseGrabada(
    request: EliminarClaseGrabadaRequest
  ): Promise<EliminarClaseGrabadaResponse>;
  consultarCatalogoClases(
    request: ConsultarCatalogoClasesRequest
  ): Promise<ConsultarCatalogoClasesResponse>;
  asignarTemaClaseGrabada(
    request: AsignarTemaClaseGrabadaRequest
  ): Promise<AsignarTemaClaseGrabadaResponse>;
  desasignarTemaClaseGrabada(
    request: DesasignarTemaClaseGrabadaRequest
  ): Promise<DesasignarTemaClaseGrabadaResponse>;
  cargaMasivaClases(request: BatchCrearClaseRequest): Promise<BatchCrearClaseResponse>;
  visualizarClase(request: VisualizarClaseRequest): Promise<VisualizarClaseResponse>;
  calificarClase(request: CalificarClaseRequest): Promise<CalificarClaseResponse>;
  consultarCalificacionUsuario(
    request: ConsultarCalificacionUsuarioRequest
  ): Promise<ConsultarCalificacionUsuarioResponse>;
  consultarClasesMasVistas(
    request: ConsultarClasesMasVistasRequest
  ): Promise<ConsultarClasesMasVistasResponse>;
  consultarTemasTendencia(
    request: ConsultarTemasTendenciaRequest
  ): Promise<ConsultarTemasTendenciaResponse>;
  consultarRankingValoradas(
    request: ConsultarRankingValoradasRequest
  ): Promise<ConsultarRankingValoradasResponse>;
  consultarAuditLogs(
    request: ConsultarAuditLogsRequest
  ): Promise<ConsultarAuditLogsResponse>;
}

export class AnaliticaGrpcClient extends GrpcBaseClient implements AnaliticaClient {
  constructor(url: string = servicesConfig.analitica.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as AnalisisGrpcObject;
    return object.analisis.AnalisisService;
  }

  crearUnidad(request: CrearUnidadRequest): Promise<CrearUnidadResponse> {
    return this.unary<CrearUnidadResponse>("CrearUnidad", request);
  }

  editarUnidad(request: EditarUnidadRequest): Promise<EditarUnidadResponse> {
    return this.unary<EditarUnidadResponse>("EditarUnidad", request);
  }

  eliminarUnidad(request: EliminarUnidadRequest): Promise<EliminarUnidadResponse> {
    return this.unary<EliminarUnidadResponse>("EliminarUnidad", request);
  }

  consultarUnidades(
    request: ConsultarUnidadesRequest
  ): Promise<ConsultarUnidadesResponse> {
    return this.unary<ConsultarUnidadesResponse>("ConsultarUnidades", request);
  }

  crearTema(request: CrearTemaRequest): Promise<CrearTemaResponse> {
    return this.unary<CrearTemaResponse>("CrearTema", request);
  }

  editarTema(request: EditarTemaRequest): Promise<EditarTemaResponse> {
    return this.unary<EditarTemaResponse>("EditarTema", request);
  }

  eliminarTema(request: EliminarTemaRequest): Promise<EliminarTemaResponse> {
    return this.unary<EliminarTemaResponse>("EliminarTema", request);
  }

  consultarTemas(request: ConsultarTemasRequest): Promise<ConsultarTemasResponse> {
    return this.unary<ConsultarTemasResponse>("ConsultarTemas", request);
  }

  crearClaseGrabada(
    request: CrearClaseGrabadaRequest
  ): Promise<CrearClaseGrabadaResponse> {
    return this.unary<CrearClaseGrabadaResponse>("CrearClaseGrabada", request);
  }

  editarClaseGrabada(
    request: EditarClaseGrabadaRequest
  ): Promise<EditarClaseGrabadaResponse> {
    return this.unary<EditarClaseGrabadaResponse>("EditarClaseGrabada", request);
  }

  eliminarClaseGrabada(
    request: EliminarClaseGrabadaRequest
  ): Promise<EliminarClaseGrabadaResponse> {
    return this.unary<EliminarClaseGrabadaResponse>("EliminarClaseGrabada", request);
  }

  consultarCatalogoClases(
    request: ConsultarCatalogoClasesRequest
  ): Promise<ConsultarCatalogoClasesResponse> {
    return this.unary<ConsultarCatalogoClasesResponse>(
      "ConsultarCatalogoClases",
      request
    );
  }

  asignarTemaClaseGrabada(
    request: AsignarTemaClaseGrabadaRequest
  ): Promise<AsignarTemaClaseGrabadaResponse> {
    return this.unary<AsignarTemaClaseGrabadaResponse>(
      "AsignarTemaClaseGrabada",
      request
    );
  }

  desasignarTemaClaseGrabada(
    request: DesasignarTemaClaseGrabadaRequest
  ): Promise<DesasignarTemaClaseGrabadaResponse> {
    return this.unary<DesasignarTemaClaseGrabadaResponse>(
      "DesasignarTemaClaseGrabada",
      request
    );
  }

  cargaMasivaClases(request: BatchCrearClaseRequest): Promise<BatchCrearClaseResponse> {
    return this.unary<BatchCrearClaseResponse>("CargaMasivaClases", request);
  }

  visualizarClase(request: VisualizarClaseRequest): Promise<VisualizarClaseResponse> {
    return this.unary<VisualizarClaseResponse>("VisualizarClase", request);
  }

  calificarClase(request: CalificarClaseRequest): Promise<CalificarClaseResponse> {
    return this.unary<CalificarClaseResponse>("CalificarClase", request);
  }

  consultarCalificacionUsuario(
    request: ConsultarCalificacionUsuarioRequest
  ): Promise<ConsultarCalificacionUsuarioResponse> {
    return this.unary<ConsultarCalificacionUsuarioResponse>(
      "ConsultarCalificacionUsuario",
      request
    );
  }

  consultarClasesMasVistas(
    request: ConsultarClasesMasVistasRequest
  ): Promise<ConsultarClasesMasVistasResponse> {
    return this.unary<ConsultarClasesMasVistasResponse>(
      "ConsultarClasesMasVistas",
      request
    );
  }

  consultarTemasTendencia(
    request: ConsultarTemasTendenciaRequest
  ): Promise<ConsultarTemasTendenciaResponse> {
    return this.unary<ConsultarTemasTendenciaResponse>(
      "ConsultarTemasTendencia",
      request
    );
  }

  consultarRankingValoradas(
    request: ConsultarRankingValoradasRequest
  ): Promise<ConsultarRankingValoradasResponse> {
    return this.unary<ConsultarRankingValoradasResponse>(
      "ConsultarRankingValoradas",
      request
    );
  }

  consultarAuditLogs(
    request: ConsultarAuditLogsRequest
  ): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>("ConsultarAuditLogs", request);
  }
}
