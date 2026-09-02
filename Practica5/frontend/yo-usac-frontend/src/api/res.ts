import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  ActualizarVersionArchivoPayload,
  ActualizarVersionArchivoResponse,
  ActualizarTagResponse,
  AgregarArchivoPayload,
  AgregarArchivoResponse,
  ConsultarRepositorioResponse,
  ConsultarVersionArchivoResponse,
  ConsultarVersionesArchivoResponse,
  CrearRepositorioPayload,
  CrearRepositorioResponse,
  EliminarArchivoResponse,
  ConsultarApuntePayload,
  ConsultarApunteResponse,
  CrearApuntePayload,
  CrearApunteResponse,
  ActualizarApuntePayload,
  ActualizarApunteResponse,
  AgregarMarcadorTiempoPayload,
  AgregarMarcadorTiempoResponse,
  EliminarMarcadorTiempoResponse,
} from '../types/recursos.types'

export class RecursosApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async crearRepositorio(payload: CrearRepositorioPayload): Promise<CrearRepositorioResponse> {
    const { data } = await this.httpClient.post<CrearRepositorioResponse>('/res', payload)
    return data
  }

  async agregarArchivo(payload: AgregarArchivoPayload): Promise<AgregarArchivoResponse> {
    const { data } = await this.httpClient.post<AgregarArchivoResponse>('/res/archivos', payload)
    return data
  }

  async actualizarVersionArchivo(
    idArchivo: number,
    payload: ActualizarVersionArchivoPayload
  ): Promise<ActualizarVersionArchivoResponse> {
    const { data } = await this.httpClient.put<ActualizarVersionArchivoResponse>(
      `/res/archivos/${idArchivo}/version`,
      payload
    )
    return data
  }

  async eliminarArchivo(idArchivo: number): Promise<EliminarArchivoResponse> {
    const { data } = await this.httpClient.delete<EliminarArchivoResponse>(
      `/res/archivos/${idArchivo}`
    )
    return data
  }

  async actualizarTag(idVersion: number, tag: string): Promise<ActualizarTagResponse> {
    const { data } = await this.httpClient.put<ActualizarTagResponse>(
      `/res/archivos/versiones/${idVersion}/tag`,
      { tag }
    )
    return data
  }

  async consultarRepositorio(idClase: number): Promise<ConsultarRepositorioResponse> {
    const { data } = await this.httpClient.get<ConsultarRepositorioResponse>(
      `/res/${idClase}`
    )
    return data
  }

  async consultarVersionesArchivo(idArchivo: number): Promise<ConsultarVersionesArchivoResponse> {
    const { data } = await this.httpClient.get<ConsultarVersionesArchivoResponse>(
      `/res/archivos/${idArchivo}/versiones`
    )
    return data
  }

  async consultarVersionArchivo(
    idArchivo: number,
    idVersion: number
  ): Promise<ConsultarVersionArchivoResponse> {
    const { data } = await this.httpClient.get<ConsultarVersionArchivoResponse>(
      `/res/archivos/${idArchivo}/versiones/${idVersion}`
    )
    return data
  }

  async consultarApunte(payload: ConsultarApuntePayload): Promise<ConsultarApunteResponse> {
    const { data } = await this.httpClient.get<ConsultarApunteResponse>('/res/apunte', {
      params: payload,
    })
    return data
  }

  async crearApunte(payload: CrearApuntePayload): Promise<CrearApunteResponse> {
    const { data } = await this.httpClient.post<CrearApunteResponse>('/res/apunte', payload)
    return data
  }

  async actualizarApunte(payload: ActualizarApuntePayload): Promise<ActualizarApunteResponse> {
    const { data } = await this.httpClient.put<ActualizarApunteResponse>('/res/apunte', payload)
    return data
  }

  async agregarMarcadorTiempo(
    payload: AgregarMarcadorTiempoPayload
  ): Promise<AgregarMarcadorTiempoResponse> {
    const { data } = await this.httpClient.post<AgregarMarcadorTiempoResponse>(
      '/res/apunte/marcadores',
      payload
    )
    return data
  }

  async eliminarMarcadorTiempo(idMarcador: number): Promise<EliminarMarcadorTiempoResponse> {
    const { data } = await this.httpClient.delete<EliminarMarcadorTiempoResponse>(
      `/res/apunte/marcadores/${idMarcador}`
    )
    return data
  }
}

export const recursosApi = new RecursosApi()
