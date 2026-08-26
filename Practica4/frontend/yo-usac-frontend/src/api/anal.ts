import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  AsignarTemaClaseGrabadaPayload,
  AsignarTemaClaseGrabadaResponse,
  CargaMasivaClasesPayload,
  CargaMasivaClasesResponse,
  CalificarClasePayload,
  CalificarClaseResponse,
  ConsultarCalificacionUsuarioResponse,
  ConsultarAuditLogsPayload,
  ConsultarAuditLogsResponse,
  ConsultarCatalogoClasesResponse,
  ConsultarClasesMasVistasResponse,
  ConsultarRankingValoradasResponse,
  ConsultarTemasPayload,
  ConsultarTemasResponse,
  ConsultarTendenciasPayload,
  ConsultarTemasTendenciaResponse,
  ConsultarUnidadesResponse,
  CrearClaseGrabadaPayload,
  CrearClaseGrabadaResponse,
  CrearTemaPayload,
  CrearTemaResponse,
  CrearUnidadPayload,
  CrearUnidadResponse,
  DesasignarTemaClaseGrabadaResponse,
  EditarClaseGrabadaPayload,
  EditarClaseGrabadaResponse,
  EditarTemaPayload,
  EditarTemaResponse,
  EditarUnidadPayload,
  EditarUnidadResponse,
  EliminarClaseGrabadaResponse,
  EliminarTemaResponse,
  EliminarUnidadResponse,
  VisualizarClasePayload,
  VisualizarClaseResponse,
} from '../types/analitica.types'

export class AnaliticaApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async crearUnidad(payload: CrearUnidadPayload): Promise<CrearUnidadResponse> {
    const { data } = await this.httpClient.post<CrearUnidadResponse>('/anal/unidad', payload)
    return data
  }

  async editarUnidad(payload: EditarUnidadPayload): Promise<EditarUnidadResponse> {
    const { data } = await this.httpClient.patch<EditarUnidadResponse>('/anal/unidad', payload)
    return data
  }

  async eliminarUnidad(idUnidad: number): Promise<EliminarUnidadResponse> {
    const { data } = await this.httpClient.delete<EliminarUnidadResponse>(
      `/anal/unidad/${idUnidad}`
    )
    return data
  }

  async consultarUnidades(): Promise<ConsultarUnidadesResponse> {
    const { data } = await this.httpClient.get<ConsultarUnidadesResponse>('/anal/unidades')
    return data
  }

  async crearTema(payload: CrearTemaPayload): Promise<CrearTemaResponse> {
    const { data } = await this.httpClient.post<CrearTemaResponse>('/anal/tema', payload)
    return data
  }

  async editarTema(payload: EditarTemaPayload): Promise<EditarTemaResponse> {
    const { data } = await this.httpClient.patch<EditarTemaResponse>('/anal/tema', payload)
    return data
  }

  async eliminarTema(idTema: number): Promise<EliminarTemaResponse> {
    const { data } = await this.httpClient.delete<EliminarTemaResponse>(`/anal/tema/${idTema}`)
    return data
  }

  async consultarTemas(
    payload: ConsultarTemasPayload = { id_unidad: 0 }
  ): Promise<ConsultarTemasResponse> {
    const { data } = await this.httpClient.get<ConsultarTemasResponse>('/anal/temas', {
      params: payload,
    })
    return data
  }

  async crearClaseGrabada(payload: CrearClaseGrabadaPayload): Promise<CrearClaseGrabadaResponse> {
    const { data } = await this.httpClient.post<CrearClaseGrabadaResponse>('/anal/clase', payload)
    return data
  }

  async editarClaseGrabada(
    payload: EditarClaseGrabadaPayload
  ): Promise<EditarClaseGrabadaResponse> {
    const { data } = await this.httpClient.patch<EditarClaseGrabadaResponse>('/anal/clase', payload)
    return data
  }

  async eliminarClaseGrabada(idClase: number): Promise<EliminarClaseGrabadaResponse> {
    const { data } = await this.httpClient.delete<EliminarClaseGrabadaResponse>(
      `/anal/clase/${idClase}`
    )
    return data
  }

  async consultarCatalogoClases(): Promise<ConsultarCatalogoClasesResponse> {
    const { data } = await this.httpClient.get<ConsultarCatalogoClasesResponse>('/anal/clases')
    return data
  }

  async asignarTemaClaseGrabada(
    payload: AsignarTemaClaseGrabadaPayload
  ): Promise<AsignarTemaClaseGrabadaResponse> {
    const { data } = await this.httpClient.post<AsignarTemaClaseGrabadaResponse>(
      '/anal/clase/asignar-tema',
      payload
    )
    return data
  }

  async desasignarTemaClaseGrabada(
    idClase: number,
    idTema: number
  ): Promise<DesasignarTemaClaseGrabadaResponse> {
    const { data } = await this.httpClient.delete<DesasignarTemaClaseGrabadaResponse>(
      `/anal/clase/${idClase}/tema/${idTema}`
    )
    return data
  }

  async cargaMasivaClases(items: CargaMasivaClasesPayload): Promise<CargaMasivaClasesResponse> {
    const { data } = await this.httpClient.post<CargaMasivaClasesResponse>('/anal/clases/batch', items)
    return data
  }

  async visualizarClase(payload: VisualizarClasePayload): Promise<VisualizarClaseResponse> {
    const { data } = await this.httpClient.post<VisualizarClaseResponse>(
      '/anal/clase/visualizar',
      payload
    )
    return data
  }

  async calificarClase(payload: CalificarClasePayload): Promise<CalificarClaseResponse> {
    const { data } = await this.httpClient.post<CalificarClaseResponse>('/anal/clase/calificar', {
      ...payload,
      puntuacion: Number(payload.puntuacion),
    })
    return data
  }

  async consultarCalificacionUsuario(
    idClase: number
  ): Promise<ConsultarCalificacionUsuarioResponse> {
    const { data } = await this.httpClient.get<ConsultarCalificacionUsuarioResponse>(
      `/anal/clase/${idClase}/calificacion`
    )
    return data
  }

  async consultarClasesMasVistas(
    payload: ConsultarTendenciasPayload = {}
  ): Promise<ConsultarClasesMasVistasResponse> {
    const { data } = await this.httpClient.get<ConsultarClasesMasVistasResponse>(
      '/anal/clases/mas-vistas',
      { params: payload }
    )
    return data
  }

  async consultarTemasTendencia(
    payload: ConsultarTendenciasPayload = {}
  ): Promise<ConsultarTemasTendenciaResponse> {
    const { data } = await this.httpClient.get<ConsultarTemasTendenciaResponse>(
      '/anal/clases/tendencia',
      { params: payload }
    )
    return data
  }

  async consultarRankingValoradas(payload?: { limite?: number }): Promise<ConsultarRankingValoradasResponse> {
    const { data } = await this.httpClient.get<ConsultarRankingValoradasResponse>(
      '/anal/clases/ranking',
      { params: payload }
    )
    return data
  }

  async consultarAudit(payload: ConsultarAuditLogsPayload = {}): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/anal/audit', {
      params: payload,
    })
    return data
  }
}

export const analiticaApi = new AnaliticaApi()
