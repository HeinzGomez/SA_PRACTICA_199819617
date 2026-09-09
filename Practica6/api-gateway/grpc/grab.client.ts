import { servicesConfig } from "../config/services";
import { GrpcBaseClient, ServiceConstructor } from "./base.client";
import {
  AsignarAuxiliarRequest,
  AsignarAuxiliarResponse,
  AsignarDocenteRequest,
  AsignarDocenteResponse,
  AsignarMaterialApoyoRequest,
  AsignarMaterialApoyoResponse,
  AsignarTemaClaseGrabadaRequest,
  AsignarTemaClaseGrabadaResponse,
  BusquedaAvanzadaRequest,
  BusquedaAvanzadaResponse,
  ConsultarAuditLogsRequest,
  ConsultarAuditLogsResponse,
  ConsultarCatalogoClasesRequest,
  ConsultarCatalogoClasesResponse,
  ConsultarParticipantesClaseRequest,
  ConsultarParticipantesClaseResponse,
  ConsultarTemasRequest,
  ConsultarTemasResponse,
  ConsultarUnidadesRequest,
  ConsultarUnidadesResponse,
  CrearClaseGrabadaRequest,
  CrearClaseGrabadaResponse,
  CrearTemaRequest,
  CrearTemaResponse,
  EditarTemaRequest,
  EditarTemaResponse,
  EliminarTemaRequest,
  EliminarTemaResponse,
  CrearUnidadRequest,
  CrearUnidadResponse,
  EditarClaseGrabadaRequest,
  EditarClaseGrabadaResponse,
  EditarUnidadRequest,
  EditarUnidadResponse,
  EliminarClaseGrabadaRequest,
  EliminarClaseGrabadaResponse,
  EliminarUnidadRequest,
  EliminarUnidadResponse,
  ObtenerDetalleClaseGrabadaRequest,
  ObtenerDetalleClaseGrabadaResponse,
  ObtenerEnlaceClaseGrabadaRequest,
  ObtenerEnlaceClaseGrabadaResponse,
  BatchCrearClaseRequest,
  BatchCrearClaseResponse,
  DesasignarDocenteRequest,
  DesasignarDocenteResponse,
  DesasignarAuxiliarRequest,
  DesasignarAuxiliarResponse,
  DesasignarMaterialApoyoRequest,
  DesasignarMaterialApoyoResponse,
  DesasignarTemaClaseGrabadaRequest,
  DesasignarTemaClaseGrabadaResponse,
  // HeinzGomez - tipos de capítulos
  CrearCapituloRequest,
  CrearCapituloResponse,
  EditarCapituloRequest,
  EditarCapituloResponse,
  EliminarCapituloRequest,
  EliminarCapituloResponse,
  ConsultarCapitulosClaseRequest,
  ConsultarCapitulosClaseResponse,
  // Playlists
  ConsultarPlaylistsUsuarioRequest,
  ConsultarPlaylistsUsuarioResponse,
  ConsultarPlaylistPorHashRequest,
  ConsultarPlaylistPorHashResponse,
  ConsultarVideosPlaylistRequest,
  ConsultarVideosPlaylistResponse,
  ConsultarVideosPlaylistPorHashRequest,
  ConsultarVideosPlaylistPorHashResponse,
  CrearPlaylistRequest,
  CrearPlaylistResponse,
  EliminarPlaylistRequest,
  EliminarPlaylistResponse,
  CambiarVisibilidadPlaylistRequest,
  CambiarVisibilidadPlaylistResponse,
  AgregarVideoPlaylistRequest,
  AgregarVideoPlaylistResponse,
  EliminarVideoPlaylistRequest,
  EliminarVideoPlaylistResponse,
  GenerarLinkPlaylistRequest,
  GenerarLinkPlaylistResponse,
} from "../types/grabaciones.types";

const PROTO_FILE = "grabaciones.proto";

type GrabacionesGrpcObject = {
  grabaciones: {
    GrabacionesService: ServiceConstructor;
  };
};

export interface GrabacionesClient {
  consultarCatalogoClases(
    request: ConsultarCatalogoClasesRequest
  ): Promise<ConsultarCatalogoClasesResponse>;
  crearUnidad(request: CrearUnidadRequest): Promise<CrearUnidadResponse>;
  editarUnidad(request: EditarUnidadRequest): Promise<EditarUnidadResponse>;
  eliminarUnidad(request: EliminarUnidadRequest): Promise<EliminarUnidadResponse>;
  consultarUnidades(request: ConsultarUnidadesRequest): Promise<ConsultarUnidadesResponse>;
  crearTema(request: CrearTemaRequest): Promise<CrearTemaResponse>;
  editarTema(request: EditarTemaRequest): Promise<EditarTemaResponse>;
  eliminarTema(request: EliminarTemaRequest): Promise<EliminarTemaResponse>;
  consultarTemas(request: ConsultarTemasRequest): Promise<ConsultarTemasResponse>;
  crearClaseGrabada(request: CrearClaseGrabadaRequest): Promise<CrearClaseGrabadaResponse>;
  editarClaseGrabada(request: EditarClaseGrabadaRequest): Promise<EditarClaseGrabadaResponse>;
  eliminarClaseGrabada(
    request: EliminarClaseGrabadaRequest
  ): Promise<EliminarClaseGrabadaResponse>;
  busquedaAvanzada(request: BusquedaAvanzadaRequest): Promise<BusquedaAvanzadaResponse>;
  obtenerDetalleClaseGrabada(
    request: ObtenerDetalleClaseGrabadaRequest
  ): Promise<ObtenerDetalleClaseGrabadaResponse>;
  obtenerEnlaceClaseGrabada(
    request: ObtenerEnlaceClaseGrabadaRequest
  ): Promise<ObtenerEnlaceClaseGrabadaResponse>;
  cargaMasivaClases(request: BatchCrearClaseRequest): Promise<BatchCrearClaseResponse>;
  asignarDocente(request: AsignarDocenteRequest): Promise<AsignarDocenteResponse>;
  asignarAuxiliar(request: AsignarAuxiliarRequest): Promise<AsignarAuxiliarResponse>;
  asignarMaterialApoyo(
    request: AsignarMaterialApoyoRequest
  ): Promise<AsignarMaterialApoyoResponse>;
  asignarTemaClaseGrabada(
    request: AsignarTemaClaseGrabadaRequest
  ): Promise<AsignarTemaClaseGrabadaResponse>;
  desasignarDocente(request: DesasignarDocenteRequest): Promise<DesasignarDocenteResponse>;
  desasignarAuxiliar(request: DesasignarAuxiliarRequest): Promise<DesasignarAuxiliarResponse>;
  desasignarMaterialApoyo(
    request: DesasignarMaterialApoyoRequest
  ): Promise<DesasignarMaterialApoyoResponse>;
  desasignarTemaClaseGrabada(
    request: DesasignarTemaClaseGrabadaRequest
  ): Promise<DesasignarTemaClaseGrabadaResponse>;
  consultarParticipantesClase(
    request: ConsultarParticipantesClaseRequest
  ): Promise<ConsultarParticipantesClaseResponse>;
  // HeinzGomez - métodos de capítulos
  crearCapitulo(request: CrearCapituloRequest): Promise<CrearCapituloResponse>;
  editarCapitulo(request: EditarCapituloRequest): Promise<EditarCapituloResponse>;
  eliminarCapitulo(request: EliminarCapituloRequest): Promise<EliminarCapituloResponse>;
  consultarCapitulosClase(
    request: ConsultarCapitulosClaseRequest
  ): Promise<ConsultarCapitulosClaseResponse>;
  // Playlists
  consultarPlaylistsUsuario(
    request: ConsultarPlaylistsUsuarioRequest
  ): Promise<ConsultarPlaylistsUsuarioResponse>;
  consultarPlaylistPorHash(
    request: ConsultarPlaylistPorHashRequest
  ): Promise<ConsultarPlaylistPorHashResponse>;
  consultarVideosPlaylist(
    request: ConsultarVideosPlaylistRequest
  ): Promise<ConsultarVideosPlaylistResponse>;
  consultarVideosPlaylistPorHash(
    request: ConsultarVideosPlaylistPorHashRequest
  ): Promise<ConsultarVideosPlaylistPorHashResponse>;
  crearPlaylist(request: CrearPlaylistRequest): Promise<CrearPlaylistResponse>;
  eliminarPlaylist(request: EliminarPlaylistRequest): Promise<EliminarPlaylistResponse>;
  cambiarVisibilidadPlaylist(
    request: CambiarVisibilidadPlaylistRequest
  ): Promise<CambiarVisibilidadPlaylistResponse>;
  agregarVideoPlaylist(
    request: AgregarVideoPlaylistRequest
  ): Promise<AgregarVideoPlaylistResponse>;
  eliminarVideoPlaylist(
    request: EliminarVideoPlaylistRequest
  ): Promise<EliminarVideoPlaylistResponse>;
  generarLinkPlaylist(
    request: GenerarLinkPlaylistRequest
  ): Promise<GenerarLinkPlaylistResponse>;
  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse>;
}

export class GrabacionesGrpcClient extends GrpcBaseClient implements GrabacionesClient {
  constructor(url: string = servicesConfig.grabaciones.grpcUrl) {
    super(PROTO_FILE, url);
  }

  protected resolveService(grpcObject: unknown): ServiceConstructor {
    const object = grpcObject as GrabacionesGrpcObject;
    return object.grabaciones.GrabacionesService;
  }

  consultarCatalogoClases(
    request: ConsultarCatalogoClasesRequest
  ): Promise<ConsultarCatalogoClasesResponse> {
    return this.unary<ConsultarCatalogoClasesResponse>("ConsultarCatalogoClases", request);
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

  consultarUnidades(request: ConsultarUnidadesRequest): Promise<ConsultarUnidadesResponse> {
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

  crearClaseGrabada(request: CrearClaseGrabadaRequest): Promise<CrearClaseGrabadaResponse> {
    return this.unary<CrearClaseGrabadaResponse>("CrearClaseGrabada", request);
  }

  editarClaseGrabada(request: EditarClaseGrabadaRequest): Promise<EditarClaseGrabadaResponse> {
    return this.unary<EditarClaseGrabadaResponse>("EditarClaseGrabada", request);
  }

  eliminarClaseGrabada(
    request: EliminarClaseGrabadaRequest
  ): Promise<EliminarClaseGrabadaResponse> {
    return this.unary<EliminarClaseGrabadaResponse>("EliminarClaseGrabada", request);
  }

  busquedaAvanzada(request: BusquedaAvanzadaRequest): Promise<BusquedaAvanzadaResponse> {
    return this.unary<BusquedaAvanzadaResponse>("BusquedaAvanzada", request);
  }

  obtenerDetalleClaseGrabada(
    request: ObtenerDetalleClaseGrabadaRequest
  ): Promise<ObtenerDetalleClaseGrabadaResponse> {
    return this.unary<ObtenerDetalleClaseGrabadaResponse>("ObtenerDetalleClaseGrabada", request);
  }

  obtenerEnlaceClaseGrabada(
    request: ObtenerEnlaceClaseGrabadaRequest
  ): Promise<ObtenerEnlaceClaseGrabadaResponse> {
    return this.unary<ObtenerEnlaceClaseGrabadaResponse>("ObtenerEnlaceClaseGrabada", request);
  }

  cargaMasivaClases(request: BatchCrearClaseRequest): Promise<BatchCrearClaseResponse> {
    return this.unary<BatchCrearClaseResponse>("CargaMasivaClases", request);
  }

  asignarDocente(request: AsignarDocenteRequest): Promise<AsignarDocenteResponse> {
    return this.unary<AsignarDocenteResponse>("AsignarDocente", request);
  }

  asignarAuxiliar(request: AsignarAuxiliarRequest): Promise<AsignarAuxiliarResponse> {
    return this.unary<AsignarAuxiliarResponse>("AsignarAuxiliar", request);
  }

  asignarMaterialApoyo(
    request: AsignarMaterialApoyoRequest
  ): Promise<AsignarMaterialApoyoResponse> {
    return this.unary<AsignarMaterialApoyoResponse>("AsignarMaterialApoyo", request);
  }

  asignarTemaClaseGrabada(
    request: AsignarTemaClaseGrabadaRequest
  ): Promise<AsignarTemaClaseGrabadaResponse> {
    return this.unary<AsignarTemaClaseGrabadaResponse>("AsignarTemaClaseGrabada", request);
  }

  desasignarDocente(request: DesasignarDocenteRequest): Promise<DesasignarDocenteResponse> {
    return this.unary<DesasignarDocenteResponse>("DesasignarDocente", request);
  }

  desasignarAuxiliar(request: DesasignarAuxiliarRequest): Promise<DesasignarAuxiliarResponse> {
    return this.unary<DesasignarAuxiliarResponse>("DesasignarAuxiliar", request);
  }

  desasignarMaterialApoyo(
    request: DesasignarMaterialApoyoRequest
  ): Promise<DesasignarMaterialApoyoResponse> {
    return this.unary<DesasignarMaterialApoyoResponse>("DesasignarMaterialApoyo", request);
  }

  desasignarTemaClaseGrabada(
    request: DesasignarTemaClaseGrabadaRequest
  ): Promise<DesasignarTemaClaseGrabadaResponse> {
    return this.unary<DesasignarTemaClaseGrabadaResponse>("DesasignarTemaClaseGrabada", request);
  }

  consultarParticipantesClase(
    request: ConsultarParticipantesClaseRequest
  ): Promise<ConsultarParticipantesClaseResponse> {
    return this.unary<ConsultarParticipantesClaseResponse>("ConsultarParticipantesClase", request);
  }

  // HeinzGomez - implementación de los métodos gRPC de capítulos
  crearCapitulo(request: CrearCapituloRequest): Promise<CrearCapituloResponse> {
    return this.unary<CrearCapituloResponse>("CrearCapitulo", request);
  }

  editarCapitulo(request: EditarCapituloRequest): Promise<EditarCapituloResponse> {
    return this.unary<EditarCapituloResponse>("EditarCapitulo", request);
  }

  eliminarCapitulo(request: EliminarCapituloRequest): Promise<EliminarCapituloResponse> {
    return this.unary<EliminarCapituloResponse>("EliminarCapitulo", request);
  }

  consultarCapitulosClase(
    request: ConsultarCapitulosClaseRequest
  ): Promise<ConsultarCapitulosClaseResponse> {
    return this.unary<ConsultarCapitulosClaseResponse>("ConsultarCapitulosClase", request);
  }

  consultarPlaylistsUsuario(
    request: ConsultarPlaylistsUsuarioRequest
  ): Promise<ConsultarPlaylistsUsuarioResponse> {
    return this.unary<ConsultarPlaylistsUsuarioResponse>("ConsultarPlaylistsUsuario", request);
  }

  consultarPlaylistPorHash(
    request: ConsultarPlaylistPorHashRequest
  ): Promise<ConsultarPlaylistPorHashResponse> {
    return this.unary<ConsultarPlaylistPorHashResponse>("ConsultarPlaylistPorHash", request);
  }

  consultarVideosPlaylist(
    request: ConsultarVideosPlaylistRequest
  ): Promise<ConsultarVideosPlaylistResponse> {
    return this.unary<ConsultarVideosPlaylistResponse>("ConsultarVideosPlaylist", request);
  }

  consultarVideosPlaylistPorHash(
    request: ConsultarVideosPlaylistPorHashRequest
  ): Promise<ConsultarVideosPlaylistPorHashResponse> {
    return this.unary<ConsultarVideosPlaylistPorHashResponse>("ConsultarVideosPlaylistPorHash", request);
  }

  crearPlaylist(request: CrearPlaylistRequest): Promise<CrearPlaylistResponse> {
    return this.unary<CrearPlaylistResponse>("CrearPlaylist", request);
  }

  eliminarPlaylist(request: EliminarPlaylistRequest): Promise<EliminarPlaylistResponse> {
    return this.unary<EliminarPlaylistResponse>("EliminarPlaylist", request);
  }

  cambiarVisibilidadPlaylist(
    request: CambiarVisibilidadPlaylistRequest
  ): Promise<CambiarVisibilidadPlaylistResponse> {
    return this.unary<CambiarVisibilidadPlaylistResponse>("CambiarVisibilidadPlaylist", request);
  }

  agregarVideoPlaylist(
    request: AgregarVideoPlaylistRequest
  ): Promise<AgregarVideoPlaylistResponse> {
    return this.unary<AgregarVideoPlaylistResponse>("AgregarVideoPlaylist", request);
  }

  eliminarVideoPlaylist(
    request: EliminarVideoPlaylistRequest
  ): Promise<EliminarVideoPlaylistResponse> {
    return this.unary<EliminarVideoPlaylistResponse>("EliminarVideoPlaylist", request);
  }

  generarLinkPlaylist(
    request: GenerarLinkPlaylistRequest
  ): Promise<GenerarLinkPlaylistResponse> {
    return this.unary<GenerarLinkPlaylistResponse>("GenerarLinkPlaylist", request);
  }

  consultarAuditLogs(request: ConsultarAuditLogsRequest): Promise<ConsultarAuditLogsResponse> {
    return this.unary<ConsultarAuditLogsResponse>("ConsultarAuditLogs", request);
  }
}
