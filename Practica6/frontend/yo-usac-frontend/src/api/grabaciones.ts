import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  AsignarMaterialApoyoPayload,
  AsignarMaterialApoyoResponse,
  AsignarAuxiliarResponse,
  AsignarDocenteResponse,
  AsignarTemaClaseGrabadaResponse,
  BusquedaAvanzadaPayload,
  BusquedaAvanzadaResponse,
  ConsultarAuditLogsResponse,
  ConsultarCatalogoClasesResponse,
  ConsultarParticipantesClaseResponse,
  ConsultarTemasPayload,
  ConsultarTemasResponse,
  ConsultarUnidadesResponse,
  CrearClaseGrabadaPayload,
  CrearClaseGrabadaResponse,
  CrearTemaPayload,
  CrearTemaResponse,
  DesasignarAuxiliarResponse,
  DesasignarDocenteResponse,
  DesasignarMaterialApoyoResponse,
  DesasignarTemaClaseGrabadaResponse,
  EditarTemaPayload,
  EditarTemaResponse,
  EliminarTemaResponse,
  CrearUnidadPayload,
  CrearUnidadResponse,
  EditarClaseGrabadaPayload,
  EditarClaseGrabadaResponse,
  EditarUnidadPayload,
  EditarUnidadResponse,
  EliminarClaseGrabadaResponse,
  EliminarUnidadResponse,
  ObtenerDetalleClaseGrabadaResponse,
  ObtenerEnlaceClaseGrabadaResponse,
  ClaseCargaInput,
  BatchCrearClaseResponse,
  // HeinzGomez - tipos de capítulos
  ConsultarCapitulosClaseResponse,
  CrearCapituloResponse,
  EditarCapituloResponse,
  EliminarCapituloResponse,
  // Playlists
  ConsultarPlaylistsUsuarioPayload,
  ConsultarPlaylistsUsuarioResponse,
  ConsultarPlaylistPorHashPayload,
  ConsultarPlaylistPorHashResponse,
  ConsultarVideosPlaylistPayload,
  ConsultarVideosPlaylistResponse,
  ConsultarVideosPlaylistPorHashPayload,
  ConsultarVideosPlaylistPorHashResponse,
  CrearPlaylistPayload,
  CrearPlaylistResponse,
  EliminarPlaylistResponse,
  CambiarVisibilidadPayload,
  CambiarVisibilidadPlaylistResponse,
  AgregarVideoPlaylistPayload,
  AgregarVideoPlaylistResponse,
  EliminarVideoPlaylistResponse,
  GenerarLinkPlaylistResponse,
} from '../types/grabaciones.types'

export class GrabacionesApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async consultarCatalogoClases(pagina: number = 1): Promise<ConsultarCatalogoClasesResponse> {
    const { data } = await this.httpClient.get<ConsultarCatalogoClasesResponse>('/grab/clases', {
      params: { pagina },
    })
    return data
  }

  async busquedaAvanzada(payload: BusquedaAvanzadaPayload): Promise<BusquedaAvanzadaResponse> {
    const { data } = await this.httpClient.get<BusquedaAvanzadaResponse>('/grab/clases/busqueda', {
      params: payload,
    })
    return data
  }

  async obtenerDetalleClase(idClase: number): Promise<ObtenerDetalleClaseGrabadaResponse> {
    const { data } = await this.httpClient.get<ObtenerDetalleClaseGrabadaResponse>(
      `/grab/clase/${idClase}`
    )
    return data
  }

  async obtenerEnlaceClase(idClase: number): Promise<ObtenerEnlaceClaseGrabadaResponse> {
    const { data } = await this.httpClient.get<ObtenerEnlaceClaseGrabadaResponse>(
      `/grab/clase/${idClase}/enlace`
    )
    return data
  }

  async consultarParticipantesClase(
    idClase: number
  ): Promise<ConsultarParticipantesClaseResponse> {
    const { data } = await this.httpClient.get<ConsultarParticipantesClaseResponse>(
      `/grab/clase/${idClase}/participantes`
    )
    return data
  }

  async crearClaseGrabada(payload: CrearClaseGrabadaPayload): Promise<CrearClaseGrabadaResponse> {
    const { data } = await this.httpClient.post<CrearClaseGrabadaResponse>('/grab/clase', payload)
    return data
  }

  async editarClaseGrabada(
    idClase: number,
    payload: EditarClaseGrabadaPayload
  ): Promise<EditarClaseGrabadaResponse> {
    const { data } = await this.httpClient.patch<EditarClaseGrabadaResponse>(
      `/grab/clase/${idClase}`,
      payload
    )
    return data
  }

  async eliminarClaseGrabada(idClase: number): Promise<EliminarClaseGrabadaResponse> {
    const { data } = await this.httpClient.delete<EliminarClaseGrabadaResponse>(
      `/grab/clase/${idClase}`
    )
    return data
  }

  async asignarDocente(idClase: number, idUsuario: number): Promise<AsignarDocenteResponse> {
    const { data } = await this.httpClient.post<AsignarDocenteResponse>(
      `/grab/clase/${idClase}/docente`,
      { id_usuario: idUsuario }
    )
    return data
  }

  async desasignarDocente(idClase: number, idUsuario: number): Promise<DesasignarDocenteResponse> {
    const { data } = await this.httpClient.delete<DesasignarDocenteResponse>(
      `/grab/clase/${idClase}/docente/${idUsuario}`
    )
    return data
  }

  async asignarAuxiliar(idClase: number, idUsuario: number): Promise<AsignarAuxiliarResponse> {
    const { data } = await this.httpClient.post<AsignarAuxiliarResponse>(
      `/grab/clase/${idClase}/auxiliar`,
      { id_usuario: idUsuario }
    )
    return data
  }

  async desasignarAuxiliar(idClase: number, idUsuario: number): Promise<DesasignarAuxiliarResponse> {
    const { data } = await this.httpClient.delete<DesasignarAuxiliarResponse>(
      `/grab/clase/${idClase}/auxiliar/${idUsuario}`
    )
    return data
  }

  async asignarMaterialApoyo(
    idClase: number,
    payload: AsignarMaterialApoyoPayload
  ): Promise<AsignarMaterialApoyoResponse> {
    const { data } = await this.httpClient.post<AsignarMaterialApoyoResponse>(
      `/grab/clase/${idClase}/material`,
      payload
    )
    return data
  }

  async desasignarMaterialApoyo(idMaterial: number): Promise<DesasignarMaterialApoyoResponse> {
    const { data } = await this.httpClient.delete<DesasignarMaterialApoyoResponse>(
      `/grab/material/${idMaterial}`
    )
    return data
  }

  async asignarTemaClaseGrabada(
    idClase: number,
    idTema: number
  ): Promise<AsignarTemaClaseGrabadaResponse> {
    const { data } = await this.httpClient.post<AsignarTemaClaseGrabadaResponse>(
      `/grab/clase/${idClase}/tema`,
      { id_tema: idTema }
    )
    return data
  }

  async desasignarTemaClaseGrabada(
    idClase: number,
    idTema: number
  ): Promise<DesasignarTemaClaseGrabadaResponse> {
    const { data } = await this.httpClient.delete<DesasignarTemaClaseGrabadaResponse>(
      `/grab/clase/${idClase}/tema/${idTema}`
    )
    return data
  }

  async consultarUnidades(): Promise<ConsultarUnidadesResponse> {
    const { data } = await this.httpClient.get<ConsultarUnidadesResponse>('/grab/unidades')
    return data
  }

  async crearUnidad(payload: CrearUnidadPayload): Promise<CrearUnidadResponse> {
    const { data } = await this.httpClient.post<CrearUnidadResponse>('/grab/unidad', payload)
    return data
  }

  async editarUnidad(
    idUnidad: number,
    payload: EditarUnidadPayload
  ): Promise<EditarUnidadResponse> {
    const { data } = await this.httpClient.patch<EditarUnidadResponse>(
      `/grab/unidad/${idUnidad}`,
      payload
    )
    return data
  }

  async eliminarUnidad(idUnidad: number): Promise<EliminarUnidadResponse> {
    const { data } = await this.httpClient.delete<EliminarUnidadResponse>(
      `/grab/unidad/${idUnidad}`
    )
    return data
  }

  async consultarTemas(
    payload: ConsultarTemasPayload = { id_unidad: 0 }
  ): Promise<ConsultarTemasResponse> {
    const { data } = await this.httpClient.get<ConsultarTemasResponse>('/grab/temas', {
      params: payload,
    })
    return data
  }

  async crearTema(payload: CrearTemaPayload): Promise<CrearTemaResponse> {
    const { data } = await this.httpClient.post<CrearTemaResponse>('/grab/tema', payload)
    return data
  }

  async editarTema(idTema: number, payload: EditarTemaPayload): Promise<EditarTemaResponse> {
    const { data } = await this.httpClient.patch<EditarTemaResponse>(`/grab/tema/${idTema}`, payload)
    return data
  }

  async eliminarTema(idTema: number): Promise<EliminarTemaResponse> {
    const { data } = await this.httpClient.delete<EliminarTemaResponse>(`/grab/tema/${idTema}`)
    return data
  }

  async consultarAudit(payload?: {
    pagina?: number
    usuario_filtro?: number
    tabla_filtro?: string
  }): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/grab/audit', {
      params: payload,
    })
    return data
  }

  // HeinzGomez - Segmentación por capítulos
  async consultarCapitulos(idClase: number): Promise<ConsultarCapitulosClaseResponse> {
    const { data } = await this.httpClient.get<ConsultarCapitulosClaseResponse>(
      `/grab/clase/${idClase}/capitulos`
    )
    return data
  }

  async crearCapitulo(
    idClase: number,
    payload: { titulo: string; tiempo_inicio: number }
  ): Promise<CrearCapituloResponse> {
    const { data } = await this.httpClient.post<CrearCapituloResponse>(
      `/grab/clase/${idClase}/capitulo`,
      payload
    )
    return data
  }

  async editarCapitulo(
    idCapitulo: number,
    payload: { titulo: string; tiempo_inicio: number }
  ): Promise<EditarCapituloResponse> {
    const { data } = await this.httpClient.patch<EditarCapituloResponse>(
      `/grab/capitulo/${idCapitulo}`,
      payload
    )
    return data
  }

  async eliminarCapitulo(idCapitulo: number): Promise<EliminarCapituloResponse> {
    const { data } = await this.httpClient.delete<EliminarCapituloResponse>(
      `/grab/capitulo/${idCapitulo}`
    )
    return data
  }

  async cargaMasivaClases(items: ClaseCargaInput[]): Promise<BatchCrearClaseResponse> {
    const { data } = await this.httpClient.post<BatchCrearClaseResponse>('/grab/clases/batch', items)
    return data
  }

  // ─── Playlists ───────────────────────────────────────

  async consultarPlaylistsUsuario(
    payload: ConsultarPlaylistsUsuarioPayload
  ): Promise<ConsultarPlaylistsUsuarioResponse> {
    const { data } = await this.httpClient.get<ConsultarPlaylistsUsuarioResponse>(
      `/grab/playlists/usuario/${payload.id_usuario}`,
      { params: { pagina: payload.pagina ?? 1, ordenar_por: payload.ordenar_por ?? 'fecha_creacion' } }
    )
    return data
  }

  async consultarPlaylistPorHash(
    payload: ConsultarPlaylistPorHashPayload
  ): Promise<ConsultarPlaylistPorHashResponse> {
    const { data } = await this.httpClient.get<ConsultarPlaylistPorHashResponse>(
      `/grab/playlists/hash/${payload.share_token}`
    )
    return data
  }

  async consultarVideosPlaylist(
    payload: ConsultarVideosPlaylistPayload
  ): Promise<ConsultarVideosPlaylistResponse> {
    const { data } = await this.httpClient.get<ConsultarVideosPlaylistResponse>(
      `/grab/playlists/${payload.id_playlist}/videos`,
      { params: { pagina: payload.pagina ?? 1 } }
    )
    return data
  }

  async consultarVideosPlaylistPorHash(
    payload: ConsultarVideosPlaylistPorHashPayload
  ): Promise<ConsultarVideosPlaylistPorHashResponse> {
    const { data } = await this.httpClient.get<ConsultarVideosPlaylistPorHashResponse>(
      `/grab/playlists/hash/${payload.share_token}/videos`,
      { params: { pagina: payload.pagina ?? 1 } }
    )
    return data
  }

  async crearPlaylist(payload: CrearPlaylistPayload): Promise<CrearPlaylistResponse> {
    const { data } = await this.httpClient.post<CrearPlaylistResponse>('/grab/playlists', payload)
    return data
  }

  async eliminarPlaylist(idPlaylist: number): Promise<EliminarPlaylistResponse> {
    const { data } = await this.httpClient.delete<EliminarPlaylistResponse>(
      `/grab/playlists/${idPlaylist}`
    )
    return data
  }

  async cambiarVisibilidadPlaylist(
    idPlaylist: number,
    payload: CambiarVisibilidadPayload
  ): Promise<CambiarVisibilidadPlaylistResponse> {
    const { data } = await this.httpClient.put<CambiarVisibilidadPlaylistResponse>(
      `/grab/playlists/${idPlaylist}/visibilidad`,
      payload
    )
    return data
  }

  async agregarVideoPlaylist(
    idPlaylist: number,
    payload: AgregarVideoPlaylistPayload
  ): Promise<AgregarVideoPlaylistResponse> {
    const { data } = await this.httpClient.post<AgregarVideoPlaylistResponse>(
      `/grab/playlists/${idPlaylist}/videos`,
      payload
    )
    return data
  }

  async eliminarVideoPlaylist(idPlaylistClases: number): Promise<EliminarVideoPlaylistResponse> {
    const { data } = await this.httpClient.delete<EliminarVideoPlaylistResponse>(
      `/grab/playlists/videos/${idPlaylistClases}`
    )
    return data
  }

  async generarLinkPlaylist(idPlaylist: number): Promise<GenerarLinkPlaylistResponse> {
    const { data } = await this.httpClient.post<GenerarLinkPlaylistResponse>(
      `/grab/playlists/${idPlaylist}/link`,
      {}
    )
    return data
  }
}

export const grabacionesApi = new GrabacionesApi()
