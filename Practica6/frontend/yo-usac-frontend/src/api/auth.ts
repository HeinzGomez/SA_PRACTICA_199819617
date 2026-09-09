import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  CambiarPasswordPayload,
  CambiarPasswordResponse,
  CerrarSesionResponse,
  ConsultarAuditLogsPayload,
  ConsultarAuditLogsResponse,
  ConsultarUsuarioResponse,
  ConsultarUsuariosResponse,
  CrearSesionPayload,
  CrearSesionResponse,
  RegistrarUsuarioPayload,
  RegistrarUsuarioResponse,
  ValidarSesionResponse,
  IniciarOAuthGoogleResponse,
  AutenticarConGoogleResponse,
} from '../types/auth.types'

export class AuthApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async registrar(payload: RegistrarUsuarioPayload): Promise<RegistrarUsuarioResponse> {
    const { data } = await this.httpClient.post<RegistrarUsuarioResponse>(
      '/auth/registrar',
      payload
    )
    return data
  }

  async login(payload: CrearSesionPayload): Promise<CrearSesionResponse> {
    const { data } = await this.httpClient.post<CrearSesionResponse>('/auth/login', payload)
    return data
  }

  async logout(): Promise<CerrarSesionResponse> {
    const { data } = await this.httpClient.post<CerrarSesionResponse>('/auth/logout')
    return data
  }

  async validar(): Promise<ValidarSesionResponse> {
    const { data } = await this.httpClient.get<ValidarSesionResponse>('/auth/validar')
    return data
  }

  async cambiarPassword(payload: CambiarPasswordPayload): Promise<CambiarPasswordResponse> {
    const { data } = await this.httpClient.post<CambiarPasswordResponse>(
      '/auth/password',
      payload
    )
    return data
  }

  async consultarAudit(
    payload: ConsultarAuditLogsPayload = { pagina: 1, usuario_filtro: 0, tabla_filtro: '' }
  ): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/auth/audit', {
      params: payload,
    })
    return data
  }

  async consultarUsuario(idUsuario: number): Promise<ConsultarUsuarioResponse> {
    const { data } = await this.httpClient.get<ConsultarUsuarioResponse>(
      `/auth/usuario/${idUsuario}`
    )
    return data
  }

  async consultarUsuarios(): Promise<ConsultarUsuariosResponse> {
    const { data } = await this.httpClient.get<ConsultarUsuariosResponse>('/auth/usuarios')
    return data
  }

  async iniciarOAuthGoogle(): Promise<IniciarOAuthGoogleResponse> {
    const { data } = await this.httpClient.get<IniciarOAuthGoogleResponse>(
        '/auth/google'
      )
    return data
  }

  async autenticarConGoogle(code: string,state: string): Promise<AutenticarConGoogleResponse> {
    const { data } = await this.httpClient.get<AutenticarConGoogleResponse>(
        '/auth/google/callback',
        {
          params: {
            code,
            state,
          },
        }
      )

    return data
  }
}

export const authApi = new AuthApi()
