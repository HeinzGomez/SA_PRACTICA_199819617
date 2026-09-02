import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  ActualizarCheckpointPayload,
  ActualizarCheckpointResponse,
  ConsultarAuditLogsResponse,
  ConsultarEstadisticasResponse,
  ConsultarHistorialPayload,
  ConsultarHistorialResponse,
  EliminarHistorialClaseResponse,
  MarcarClaseCompletadaResponse,
  ObtenerCheckpointClaseResponse,
  RegistrarProgresoPayload,
  RegistrarProgresoResponse,
} from '../types/history.types'

export class HistoryApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async registrarProgreso(payload: RegistrarProgresoPayload): Promise<RegistrarProgresoResponse> {
    const { data } = await this.httpClient.post<RegistrarProgresoResponse>('/his/progreso', payload)
    return data
  }

  async actualizarCheckpoint(
    payload: ActualizarCheckpointPayload
  ): Promise<ActualizarCheckpointResponse> {
    const { data } = await this.httpClient.patch<ActualizarCheckpointResponse>(
      '/his/progreso',
      payload
    )
    return data
  }

  async marcarClaseCompletada(idClase: number): Promise<MarcarClaseCompletadaResponse> {
    const { data } = await this.httpClient.post<MarcarClaseCompletadaResponse>(
      `/his/clase/${idClase}/completar`
    )
    return data
  }

  async obtenerCheckpointClase(idClase: number): Promise<ObtenerCheckpointClaseResponse> {
    const { data } = await this.httpClient.get<ObtenerCheckpointClaseResponse>(
      `/his/clase/${idClase}/checkpoint`
    )
    return data
  }

  async eliminarHistorialClase(idClase: number): Promise<EliminarHistorialClaseResponse> {
    const { data } = await this.httpClient.delete<EliminarHistorialClaseResponse>(
      `/his/clase/${idClase}`
    )
    return data
  }

  async consultarHistorial(
    payload: ConsultarHistorialPayload = { pagina: 1 }
  ): Promise<ConsultarHistorialResponse> {
    const { data } = await this.httpClient.get<ConsultarHistorialResponse>('/his/usuario/historial', {
      params: payload,
    })
    return data
  }

  async consultarEstadisticas(): Promise<ConsultarEstadisticasResponse> {
    const { data } = await this.httpClient.get<ConsultarEstadisticasResponse>(
      '/his/usuario/estadisticas'
    )
    return data
  }

  async consultarAudit(payload?: {
    pagina?: number
    usuario_filtro?: number
    tabla_filtro?: string
  }): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/his/audit', {
      params: payload,
    })
    return data
  }
}

export const historyApi = new HistoryApi()
