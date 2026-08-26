import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  ActualizarEstadoMatriculaRequest,
  ActualizarEstadoMatriculaResponse,
  AsignarRolUsuarioRequest,
  AsignarRolUsuarioResponse,
  CambiarPerfilAcademicoRequest,
  CambiarPerfilAcademicoResponse,
  ComprobarRolUsuarioRequest,
  ComprobarRolUsuarioResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarAreasRequest,
  ConsultarAreasResponse,
  ConsultarCursosEstudianteRequest,
  ConsultarCursosEstudianteResponse,
  ConsultarTodasInscripcionesRequest,
  ConsultarTodasInscripcionesResponse,
  ConsultarCursosRequest,
  ConsultarCursosResponse,
  ConsultarEstadosMatriculaRequest,
  ConsultarEstadosMatriculaResponse,
  ConsultarPerfilAcademicoRequest,
  ConsultarPerfilAcademicoResponse,
  ConsultarPerfilesEstudianteRequest,
  ConsultarPerfilesEstudianteResponse,
  ConsultarRolesUsuarioRequest,
  ConsultarRolesUsuarioResponse,
  ConsultarCarrerasRequest,
  ConsultarCarrerasResponse,
  ConsultarPensumsRequest,
  ConsultarPensumsResponse,
  CrearPeriodoRequest,
  CrearPeriodoResponse,
  EditarPeriodoRequest,
  EditarPeriodoResponse,
  EliminarPeriodoRequest,
  EliminarPeriodoResponse,
  ConsultarPeriodosRequest,
  ConsultarPeriodosResponse,
  CrearAreaRequest,
  CrearAreaResponse,
  EditarAreaRequest,
  EditarAreaResponse,
  EliminarAreaRequest,
  EliminarAreaResponse,
  CrearCarreraRequest,
  CrearCarreraResponse,
  EditarCarreraRequest,
  EditarCarreraResponse,
  EliminarCarreraRequest,
  EliminarCarreraResponse,
  CrearCursoRequest,
  CrearCursoResponse,
  EditarCursoRequest,
  EditarCursoResponse,
  EliminarCursoRequest,
  EliminarCursoResponse,
  CrearPensumRequest,
  CrearPensumResponse,
  EditarPensumRequest,
  EditarPensumResponse,
  EliminarPensumRequest,
  EliminarPensumResponse,
  CrearPerfilAcademicoRequest,
  CrearPerfilAcademicoResponse,
  InscribirEstudianteRequest,
  InscribirEstudianteResponse,
  CambiarRolUsuarioRequest,
  CambiarRolUsuarioResponse,
  EliminarRolUsuarioRequest,
  EliminarRolUsuarioResponse,
} from "../types/inscripcion.types";

const PROTO_FILE = "inscripcion.proto";

type InscripcionGrpcObject = {
  inscripcion: {
    InscripcionService: ServiceConstructor;
  };
};

export interface InscripcionClient {
  crearArea(request: CrearAreaRequest): Promise<CrearAreaResponse>;
  editarArea(request: EditarAreaRequest): Promise<EditarAreaResponse>;
  eliminarArea(request: EliminarAreaRequest): Promise<EliminarAreaResponse>;
  consultarAreas(request: ConsultarAreasRequest): Promise<ConsultarAreasResponse>;
  crearCurso(request: CrearCursoRequest): Promise<CrearCursoResponse>;
  editarCurso(request: EditarCursoRequest): Promise<EditarCursoResponse>;
  eliminarCurso(request: EliminarCursoRequest): Promise<EliminarCursoResponse>;
  consultarCursos(request: ConsultarCursosRequest): Promise<ConsultarCursosResponse>;
  crearPensum(request: CrearPensumRequest): Promise<CrearPensumResponse>;
  editarPensum(request: EditarPensumRequest): Promise<EditarPensumResponse>;
  eliminarPensum(request: EliminarPensumRequest): Promise<EliminarPensumResponse>;
  consultarPensums(request: ConsultarPensumsRequest): Promise<ConsultarPensumsResponse>;
  crearCarrera(request: CrearCarreraRequest): Promise<CrearCarreraResponse>;
  editarCarrera(request: EditarCarreraRequest): Promise<EditarCarreraResponse>;
  eliminarCarrera(request: EliminarCarreraRequest): Promise<EliminarCarreraResponse>;
  consultarCarreras(request: ConsultarCarrerasRequest): Promise<ConsultarCarrerasResponse>;
  crearPeriodo(request: CrearPeriodoRequest): Promise<CrearPeriodoResponse>;
  editarPeriodo(request: EditarPeriodoRequest): Promise<EditarPeriodoResponse>;
  eliminarPeriodo(request: EliminarPeriodoRequest): Promise<EliminarPeriodoResponse>;
  consultarPeriodos(request: ConsultarPeriodosRequest): Promise<ConsultarPeriodosResponse>;
  crearPerfilAcademico(request: CrearPerfilAcademicoRequest): Promise<CrearPerfilAcademicoResponse>;
  cambiarPerfilAcademico(
    request: CambiarPerfilAcademicoRequest
  ): Promise<CambiarPerfilAcademicoResponse>;
  consultarPerfilAcademico(
    request: ConsultarPerfilAcademicoRequest
  ): Promise<ConsultarPerfilAcademicoResponse>;
  consultarPerfilesEstudiante(
    request: ConsultarPerfilesEstudianteRequest
  ): Promise<ConsultarPerfilesEstudianteResponse>;
  asignarRolUsuario(request: AsignarRolUsuarioRequest): Promise<AsignarRolUsuarioResponse>;
  cambiarRolUsuario(request: CambiarRolUsuarioRequest): Promise<CambiarRolUsuarioResponse>;
  eliminarRolUsuario(request: EliminarRolUsuarioRequest): Promise<EliminarRolUsuarioResponse>;
  comprobarRolUsuario(
    request: ComprobarRolUsuarioRequest
  ): Promise<ComprobarRolUsuarioResponse>;
  consultarRolesUsuario(
    request: ConsultarRolesUsuarioRequest
  ): Promise<ConsultarRolesUsuarioResponse>;
  inscribirEstudiante(request: InscribirEstudianteRequest): Promise<InscribirEstudianteResponse>;
  actualizarEstadoMatricula(
    request: ActualizarEstadoMatriculaRequest
  ): Promise<ActualizarEstadoMatriculaResponse>;
  consultarCursosEstudiante(
    request: ConsultarCursosEstudianteRequest
  ): Promise<ConsultarCursosEstudianteResponse>;
  consultarTodasInscripciones(
    request: ConsultarTodasInscripcionesRequest
  ): Promise<ConsultarTodasInscripcionesResponse>;
  consultarEstadosMatricula(
    request: ConsultarEstadosMatriculaRequest
  ): Promise<ConsultarEstadosMatriculaResponse>;
  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse>;
}

export class InscripcionGrpcClient extends GrpcBaseClient implements InscripcionClient {
  constructor(url: string = servicesConfig.inscripcion.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as InscripcionGrpcObject;
    return object.inscripcion.InscripcionService;
  }

  crearArea(request: CrearAreaRequest): Promise<CrearAreaResponse> {
    return this.unary<CrearAreaResponse>("CrearArea", request);
  }

  editarArea(request: EditarAreaRequest): Promise<EditarAreaResponse> {
    return this.unary<EditarAreaResponse>("EditarArea", request);
  }

  eliminarArea(request: EliminarAreaRequest): Promise<EliminarAreaResponse> {
    return this.unary<EliminarAreaResponse>("EliminarArea", request);
  }

  consultarAreas(request: ConsultarAreasRequest): Promise<ConsultarAreasResponse> {
    return this.unary<ConsultarAreasResponse>("ConsultarAreas", request);
  }

  crearCurso(request: CrearCursoRequest): Promise<CrearCursoResponse> {
    return this.unary<CrearCursoResponse>("CrearCurso", request);
  }

  editarCurso(request: EditarCursoRequest): Promise<EditarCursoResponse> {
    return this.unary<EditarCursoResponse>("EditarCurso", request);
  }

  eliminarCurso(request: EliminarCursoRequest): Promise<EliminarCursoResponse> {
    return this.unary<EliminarCursoResponse>("EliminarCurso", request);
  }

  consultarCursos(request: ConsultarCursosRequest): Promise<ConsultarCursosResponse> {
    return this.unary<ConsultarCursosResponse>("ConsultarCursos", request);
  }

  crearPensum(request: CrearPensumRequest): Promise<CrearPensumResponse> {
    return this.unary<CrearPensumResponse>("CrearPensum", request);
  }

  editarPensum(request: EditarPensumRequest): Promise<EditarPensumResponse> {
    return this.unary<EditarPensumResponse>("EditarPensum", request);
  }

  eliminarPensum(request: EliminarPensumRequest): Promise<EliminarPensumResponse> {
    return this.unary<EliminarPensumResponse>("EliminarPensum", request);
  }

  consultarPensums(request: ConsultarPensumsRequest): Promise<ConsultarPensumsResponse> {
    return this.unary<ConsultarPensumsResponse>("ConsultarPensums", request);
  }

  crearCarrera(request: CrearCarreraRequest): Promise<CrearCarreraResponse> {
    return this.unary<CrearCarreraResponse>("CrearCarrera", request);
  }

  editarCarrera(request: EditarCarreraRequest): Promise<EditarCarreraResponse> {
    return this.unary<EditarCarreraResponse>("EditarCarrera", request);
  }

  eliminarCarrera(request: EliminarCarreraRequest): Promise<EliminarCarreraResponse> {
    return this.unary<EliminarCarreraResponse>("EliminarCarrera", request);
  }

  consultarCarreras(request: ConsultarCarrerasRequest): Promise<ConsultarCarrerasResponse> {
    return this.unary<ConsultarCarrerasResponse>("ConsultarCarreras", request);
  }

  crearPeriodo(request: CrearPeriodoRequest): Promise<CrearPeriodoResponse> {
    return this.unary<CrearPeriodoResponse>("CrearPeriodo", request);
  }

  editarPeriodo(request: EditarPeriodoRequest): Promise<EditarPeriodoResponse> {
    return this.unary<EditarPeriodoResponse>("EditarPeriodo", request);
  }

  eliminarPeriodo(request: EliminarPeriodoRequest): Promise<EliminarPeriodoResponse> {
    return this.unary<EliminarPeriodoResponse>("EliminarPeriodo", request);
  }

  consultarPeriodos(request: ConsultarPeriodosRequest): Promise<ConsultarPeriodosResponse> {
    return this.unary<ConsultarPeriodosResponse>("ConsultarPeriodos", request);
  }

  crearPerfilAcademico(request: CrearPerfilAcademicoRequest): Promise<CrearPerfilAcademicoResponse> {
    return this.unary<CrearPerfilAcademicoResponse>("CrearPerfilAcademico", request);
  }

  cambiarPerfilAcademico(
    request: CambiarPerfilAcademicoRequest
  ): Promise<CambiarPerfilAcademicoResponse> {
    return this.unary<CambiarPerfilAcademicoResponse>("CambiarPerfilAcademico", request);
  }

  consultarPerfilAcademico(
    request: ConsultarPerfilAcademicoRequest
  ): Promise<ConsultarPerfilAcademicoResponse> {
    return this.unary<ConsultarPerfilAcademicoResponse>("ConsultarPerfilAcademico", request);
  }

  consultarPerfilesEstudiante(
    request: ConsultarPerfilesEstudianteRequest
  ): Promise<ConsultarPerfilesEstudianteResponse> {
    return this.unary<ConsultarPerfilesEstudianteResponse>("ConsultarPerfilesEstudiante", request);
  }

  asignarRolUsuario(request: AsignarRolUsuarioRequest): Promise<AsignarRolUsuarioResponse> {
    return this.unary<AsignarRolUsuarioResponse>("AsignarRolUsuario", request);
  }

  cambiarRolUsuario(request: CambiarRolUsuarioRequest): Promise<CambiarRolUsuarioResponse> {
    return this.unary<CambiarRolUsuarioResponse>("CambiarRolUsuario", request);
  }

  eliminarRolUsuario(request: EliminarRolUsuarioRequest): Promise<EliminarRolUsuarioResponse> {
    return this.unary<EliminarRolUsuarioResponse>("EliminarRolUsuario", request);
  }

  comprobarRolUsuario(
    request: ComprobarRolUsuarioRequest
  ): Promise<ComprobarRolUsuarioResponse> {
    return this.unary<ComprobarRolUsuarioResponse>("ComprobarRolUsuario", request);
  }

  consultarRolesUsuario(
    request: ConsultarRolesUsuarioRequest
  ): Promise<ConsultarRolesUsuarioResponse> {
    return this.unary<ConsultarRolesUsuarioResponse>("ConsultarRolesUsuario", request);
  }

  inscribirEstudiante(request: InscribirEstudianteRequest): Promise<InscribirEstudianteResponse> {
    return this.unary<InscribirEstudianteResponse>("InscribirEstudiante", request);
  }

  actualizarEstadoMatricula(
    request: ActualizarEstadoMatriculaRequest
  ): Promise<ActualizarEstadoMatriculaResponse> {
    return this.unary<ActualizarEstadoMatriculaResponse>("ActualizarEstadoMatricula", request);
  }

  consultarCursosEstudiante(
    request: ConsultarCursosEstudianteRequest
  ): Promise<ConsultarCursosEstudianteResponse> {
    return this.unary<ConsultarCursosEstudianteResponse>("ConsultarCursosEstudiante", request);
  }

  consultarTodasInscripciones(
    request: ConsultarTodasInscripcionesRequest
  ): Promise<ConsultarTodasInscripcionesResponse> {
    return this.unary<ConsultarTodasInscripcionesResponse>("ConsultarTodasInscripciones", request);
  }

  consultarEstadosMatricula(
    request: ConsultarEstadosMatriculaRequest
  ): Promise<ConsultarEstadosMatriculaResponse> {
    return this.unary<ConsultarEstadosMatriculaResponse>("ConsultarEstadosMatricula", request);
  }

  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>("ConsultarAuditLogs", request);
  }
}
