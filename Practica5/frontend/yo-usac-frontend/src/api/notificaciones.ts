import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  ConsultarAuditLogsPayload,
  ConsultarAuditLogsResponse,
  ConsultarNotificacionesPayload,
  ConsultarNotificacionesResponse,
  EnviarNotificacionAvisoGeneralPayload,
  EnviarNotificacionAvisoGeneralResponse,
  EnviarNotificacionContenidoNuevoPayload,
  EnviarNotificacionContenidoNuevoResponse,
  EnviarNotificacionRegistroPayload,
  EnviarNotificacionRegistroResponse,
} from '../types/notificaciones.types'

export class NotificacionesApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async enviarRegistro(
    payload: EnviarNotificacionRegistroPayload
  ): Promise<EnviarNotificacionRegistroResponse> {
    const { data } = await this.httpClient.post<EnviarNotificacionRegistroResponse>(
      '/not/registro',
      payload
    )
    return data
  }

  async enviarContenidoNuevo(
    payload: EnviarNotificacionContenidoNuevoPayload
  ): Promise<EnviarNotificacionContenidoNuevoResponse> {
    const { data } = await this.httpClient.post<EnviarNotificacionContenidoNuevoResponse>(
      '/not/contenido',
      payload
    )
    return data
  }

  async enviarAvisoGeneral(
    payload: EnviarNotificacionAvisoGeneralPayload
  ): Promise<EnviarNotificacionAvisoGeneralResponse> {
    const { data } = await this.httpClient.post<EnviarNotificacionAvisoGeneralResponse>(
      '/not/aviso',
      payload
    )
    return data
  }

  async consultarNotificaciones(
    payload: ConsultarNotificacionesPayload = { pagina: 1 }
  ): Promise<ConsultarNotificacionesResponse> {
    const { data } = await this.httpClient.get<ConsultarNotificacionesResponse>('/not/', {
      params: payload,
    })
    return data
  }

  async consultarAudit(
    payload: ConsultarAuditLogsPayload = {}
  ): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/not/audit', {
      params: payload,
    })
    return data
  }
}

export const notificacionesApi = new NotificacionesApi()
