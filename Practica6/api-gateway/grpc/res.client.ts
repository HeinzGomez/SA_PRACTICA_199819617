import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  CrearRepositorioRequest,
  CrearRepositorioResponse,
  AgregarArchivoRequest,
  AgregarArchivoResponse,
  ActualizarVersionArchivoRequest,
  ActualizarVersionArchivoResponse,
  ActualizarTagRequest,
  ActualizarTagResponse,
  EliminarArchivoRequest,
  EliminarArchivoResponse,
  ConsultarRepositorioRequest,
  ConsultarRepositorioResponse,
  ConsultarVersionesArchivoRequest,
  ConsultarVersionesArchivoResponse,
  ConsultarVersionArchivoRequest,
  ConsultarVersionArchivoResponse,
  ConsultarApunteRequest,
  ConsultarApunteResponse,
  CrearApunteRequest,
  CrearApunteResponse,
  ActualizarApunteRequest,
  ActualizarApunteResponse,
  AgregarMarcadorTiempoRequest,
  AgregarMarcadorTiempoResponse,
  EliminarMarcadorTiempoRequest,
  EliminarMarcadorTiempoResponse,
  ConsultarDudasClaseRequest,
  ConsultarDudasClaseResponse,
  CrearDudaRequest,
  CrearDudaResponse,
  CrearRespuestaRequest,
  CrearRespuestaResponse,
  MarcarRespuestaRequest,
  MarcarRespuestaResponse,
} from "../types/recursos.types";

const PROTO_FILE = "recursos.proto";

type RecursosGrpcObject = {
  recursos: {
    RecursosService: ServiceConstructor;
  };
};

export interface RecursosClient {
  crearRepositorio(request: CrearRepositorioRequest): Promise<CrearRepositorioResponse>;
  agregarArchivo(request: AgregarArchivoRequest): Promise<AgregarArchivoResponse>;
  actualizarVersionArchivo(
    request: ActualizarVersionArchivoRequest
  ): Promise<ActualizarVersionArchivoResponse>;
  actualizarTag(request: ActualizarTagRequest): Promise<ActualizarTagResponse>;
  eliminarArchivo(request: EliminarArchivoRequest): Promise<EliminarArchivoResponse>;
  consultarRepositorio(
    request: ConsultarRepositorioRequest
  ): Promise<ConsultarRepositorioResponse>;
  consultarVersionesArchivo(
    request: ConsultarVersionesArchivoRequest
  ): Promise<ConsultarVersionesArchivoResponse>;
  consultarVersionArchivo(
    request: ConsultarVersionArchivoRequest
  ): Promise<ConsultarVersionArchivoResponse>;
  consultarApunte(request: ConsultarApunteRequest): Promise<ConsultarApunteResponse>;
  crearApunte(request: CrearApunteRequest): Promise<CrearApunteResponse>;
  actualizarApunte(request: ActualizarApunteRequest): Promise<ActualizarApunteResponse>;
  agregarMarcadorTiempo(
    request: AgregarMarcadorTiempoRequest
  ): Promise<AgregarMarcadorTiempoResponse>;
  eliminarMarcadorTiempo(
    request: EliminarMarcadorTiempoRequest
  ): Promise<EliminarMarcadorTiempoResponse>;
  consultarDudasClase(
    request: ConsultarDudasClaseRequest
  ): Promise<ConsultarDudasClaseResponse>;
  crearDuda(request: CrearDudaRequest): Promise<CrearDudaResponse>;
  crearRespuesta(request: CrearRespuestaRequest): Promise<CrearRespuestaResponse>;
  marcarRespuesta(request: MarcarRespuestaRequest): Promise<MarcarRespuestaResponse>;
}

export class RecursosGrpcClient extends GrpcBaseClient implements RecursosClient {
  constructor(url: string = servicesConfig.resources.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as RecursosGrpcObject;
    return object.recursos.RecursosService;
  }

  crearRepositorio(request: CrearRepositorioRequest): Promise<CrearRepositorioResponse> {
    return this.unary<CrearRepositorioResponse>("CrearRepositorio", request);
  }

  agregarArchivo(request: AgregarArchivoRequest): Promise<AgregarArchivoResponse> {
    return this.unary<AgregarArchivoResponse>("AgregarArchivo", request);
  }

  actualizarVersionArchivo(
    request: ActualizarVersionArchivoRequest
  ): Promise<ActualizarVersionArchivoResponse> {
    return this.unary<ActualizarVersionArchivoResponse>("ActualizarVersionArchivo", request);
  }

  actualizarTag(request: ActualizarTagRequest): Promise<ActualizarTagResponse> {
    return this.unary<ActualizarTagResponse>("ActualizarTag", request);
  }

  eliminarArchivo(request: EliminarArchivoRequest): Promise<EliminarArchivoResponse> {
    return this.unary<EliminarArchivoResponse>("EliminarArchivo", request);
  }

  consultarRepositorio(
    request: ConsultarRepositorioRequest
  ): Promise<ConsultarRepositorioResponse> {
    return this.unary<ConsultarRepositorioResponse>("ConsultarRepositorio", request);
  }

  consultarVersionesArchivo(
    request: ConsultarVersionesArchivoRequest
  ): Promise<ConsultarVersionesArchivoResponse> {
    return this.unary<ConsultarVersionesArchivoResponse>("ConsultarVersionesArchivo", request);
  }

  consultarVersionArchivo(
    request: ConsultarVersionArchivoRequest
  ): Promise<ConsultarVersionArchivoResponse> {
    return this.unary<ConsultarVersionArchivoResponse>("ConsultarVersionArchivo", request);
  }

  consultarApunte(request: ConsultarApunteRequest): Promise<ConsultarApunteResponse> {
    return this.unary<ConsultarApunteResponse>("ConsultarApunte", request);
  }

  crearApunte(request: CrearApunteRequest): Promise<CrearApunteResponse> {
    return this.unary<CrearApunteResponse>("CrearApunte", request);
  }

  actualizarApunte(request: ActualizarApunteRequest): Promise<ActualizarApunteResponse> {
    return this.unary<ActualizarApunteResponse>("ActualizarApunte", request);
  }

  agregarMarcadorTiempo(
    request: AgregarMarcadorTiempoRequest
  ): Promise<AgregarMarcadorTiempoResponse> {
    return this.unary<AgregarMarcadorTiempoResponse>("AgregarMarcadorTiempo", request);
  }

  eliminarMarcadorTiempo(
    request: EliminarMarcadorTiempoRequest
  ): Promise<EliminarMarcadorTiempoResponse> {
    return this.unary<EliminarMarcadorTiempoResponse>("EliminarMarcadorTiempo", request);
  }

  consultarDudasClase(
    request: ConsultarDudasClaseRequest
  ): Promise<ConsultarDudasClaseResponse> {
    return this.unary<ConsultarDudasClaseResponse>("ConsultarDudasClase", request);
  }

  crearDuda(request: CrearDudaRequest): Promise<CrearDudaResponse> {
    return this.unary<CrearDudaResponse>("CrearDuda", request);
  }

  crearRespuesta(request: CrearRespuestaRequest): Promise<CrearRespuestaResponse> {
    return this.unary<CrearRespuestaResponse>("CrearRespuesta", request);
  }

  marcarRespuesta(request: MarcarRespuestaRequest): Promise<MarcarRespuestaResponse> {
    return this.unary<MarcarRespuestaResponse>("MarcarRespuesta", request);
  }
}
