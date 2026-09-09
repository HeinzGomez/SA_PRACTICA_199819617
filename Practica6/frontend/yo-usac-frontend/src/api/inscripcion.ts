import type { AxiosInstance } from 'axios'
import { api } from './axios'
import type {
  ActualizarEstadoMatriculaPayload,
  ActualizarEstadoMatriculaResponse,
  AsignarRolPayload,
  AsignarRolResponse,
  CambiarPerfilPayload,
  CambiarPerfilResponse,
  CambiarRolPayload,
  CambiarRolResponse,
  ComprobarRolPayload,
  ComprobarRolResponse,
  ConsultarAuditLogsResponse,
  ConsultarAreasResponse,
  ConsultarCarrerasResponse,
  ConsultarCursosEstudiantePayload,
  ConsultarCursosEstudianteResponse,
  ConsultarCursosResponse,
  ConsultarEstadosMatriculaResponse,
  ConsultarPerfilResponse,
  ConsultarPerfilesEstudianteResponse,
  ConsultarRolesUsuarioResponse,
  ConsultarTodasInscripcionesPayload,
  ConsultarTodasInscripcionesResponse,
  CrearAreaPayload,
  CrearAreaResponse,
  EditarAreaPayload,
  EditarAreaResponse,
  EliminarAreaResponse,
  EliminarRolPayload,
  EliminarRolResponse,
  CrearCarreraPayload,
  CrearCarreraResponse,
  EditarCarreraPayload,
  EditarCarreraResponse,
  EliminarCarreraResponse,
  CrearCursoPayload,
  CrearCursoResponse,
  EditarCursoPayload,
  EditarCursoResponse,
  EliminarCursoResponse,
  CrearPensumPayload,
  CrearPensumResponse,
  EditarPensumPayload,
  EditarPensumResponse,
  EliminarPensumResponse,
  ConsultarPensumsResponse,
  CrearPeriodoPayload,
  CrearPeriodoResponse,
  EditarPeriodoPayload,
  EditarPeriodoResponse,
  EliminarPeriodoResponse,
  ConsultarPeriodosResponse,
  CrearPerfilPayload,
  CrearPerfilResponse,
  InscribirEstudiantePayload,
  InscribirEstudianteResponse,
} from '../types/inscripcion.types'

export class InscripcionApi {
  private readonly httpClient: AxiosInstance

  constructor(httpClient: AxiosInstance = api) {
    this.httpClient = httpClient
  }

  async crearArea(payload: CrearAreaPayload): Promise<CrearAreaResponse> {
    const { data } = await this.httpClient.post<CrearAreaResponse>('/ins/area', payload)
    return data
  }

  async editarArea(payload: EditarAreaPayload): Promise<EditarAreaResponse> {
    const { data } = await this.httpClient.put<EditarAreaResponse>('/ins/area', payload)
    return data
  }

  async eliminarArea(idArea: number): Promise<EliminarAreaResponse> {
    const { data } = await this.httpClient.delete<EliminarAreaResponse>(`/ins/area/${idArea}`)
    return data
  }

  async crearCurso(payload: CrearCursoPayload): Promise<CrearCursoResponse> {
    const { data } = await this.httpClient.post<CrearCursoResponse>('/ins/curso', payload)
    return data
  }

  async editarCurso(payload: EditarCursoPayload): Promise<EditarCursoResponse> {
    const { data } = await this.httpClient.put<EditarCursoResponse>('/ins/curso', payload)
    return data
  }

  async eliminarCurso(idCurso: number): Promise<EliminarCursoResponse> {
    const { data } = await this.httpClient.delete<EliminarCursoResponse>(`/ins/curso/${idCurso}`)
    return data
  }

  async consultarAreas(): Promise<ConsultarAreasResponse> {
    const { data } = await this.httpClient.get<ConsultarAreasResponse>('/ins/areas')
    return data
  }

  async consultarCursos(idArea?: number): Promise<ConsultarCursosResponse> {
    const { data } = await this.httpClient.get<ConsultarCursosResponse>('/ins/cursos', {
      params: idArea ? { id_area: idArea } : undefined,
    })
    return data
  }

  async crearPensum(payload: CrearPensumPayload): Promise<CrearPensumResponse> {
    const { data } = await this.httpClient.post<CrearPensumResponse>('/ins/pensum', payload)
    return data
  }

  async editarPensum(payload: EditarPensumPayload): Promise<EditarPensumResponse> {
    const { data } = await this.httpClient.put<EditarPensumResponse>('/ins/pensum', payload)
    return data
  }

  async eliminarPensum(idPensum: number): Promise<EliminarPensumResponse> {
    const { data } = await this.httpClient.delete<EliminarPensumResponse>(`/ins/pensum/${idPensum}`)
    return data
  }

  async consultarPensums(): Promise<ConsultarPensumsResponse> {
    const { data } = await this.httpClient.get<ConsultarPensumsResponse>('/ins/pensums')
    return data
  }

  async crearPeriodo(payload: CrearPeriodoPayload): Promise<CrearPeriodoResponse> {
    const { data } = await this.httpClient.post<CrearPeriodoResponse>('/ins/periodo', payload)
    return data
  }

  async editarPeriodo(payload: EditarPeriodoPayload): Promise<EditarPeriodoResponse> {
    const { data } = await this.httpClient.put<EditarPeriodoResponse>('/ins/periodo', payload)
    return data
  }

  async eliminarPeriodo(idPeriodo: number): Promise<EliminarPeriodoResponse> {
    const { data } = await this.httpClient.delete<EliminarPeriodoResponse>(`/ins/periodo/${idPeriodo}`)
    return data
  }

  async consultarPeriodos(): Promise<ConsultarPeriodosResponse> {
    const { data } = await this.httpClient.get<ConsultarPeriodosResponse>('/ins/periodos')
    return data
  }

  async crearCarrera(payload: CrearCarreraPayload): Promise<CrearCarreraResponse> {
    const { data } = await this.httpClient.post<CrearCarreraResponse>('/ins/carrera', payload)
    return data
  }

  async editarCarrera(payload: EditarCarreraPayload): Promise<EditarCarreraResponse> {
    const { data } = await this.httpClient.put<EditarCarreraResponse>('/ins/carrera', payload)
    return data
  }

  async eliminarCarrera(idCarrera: number): Promise<EliminarCarreraResponse> {
    const { data } = await this.httpClient.delete<EliminarCarreraResponse>(`/ins/carrera/${idCarrera}`)
    return data
  }

  async consultarCarreras(): Promise<ConsultarCarrerasResponse> {
    const { data } = await this.httpClient.get<ConsultarCarrerasResponse>('/ins/carreras')
    return data
  }

  async crearPerfil(payload: CrearPerfilPayload): Promise<CrearPerfilResponse> {
    const { data } = await this.httpClient.post<CrearPerfilResponse>('/ins/perfil', payload)
    return data
  }

  async cambiarPerfil(payload: CambiarPerfilPayload): Promise<CambiarPerfilResponse> {
    const { data } = await this.httpClient.patch<CambiarPerfilResponse>('/ins/perfil', payload)
    return data
  }

  async consultarPerfil(idUsuario: number): Promise<ConsultarPerfilResponse> {
    const { data } = await this.httpClient.get<ConsultarPerfilResponse>('/ins/perfil', {
      params: { id_usuario: idUsuario },
    })
    return data
  }

  async consultarPerfilesEstudiante(): Promise<ConsultarPerfilesEstudianteResponse> {
    const { data } = await this.httpClient.get<ConsultarPerfilesEstudianteResponse>(
      '/ins/perfiles'
    )
    return data
  }

  async asignarRol(payload: AsignarRolPayload): Promise<AsignarRolResponse> {
    const { data } = await this.httpClient.post<AsignarRolResponse>('/ins/roles/asignar', payload)
    return data
  }

  async cambiarRol(payload: CambiarRolPayload): Promise<CambiarRolResponse> {
    const { data } = await this.httpClient.put<CambiarRolResponse>('/ins/roles/cambiar', payload)
    return data
  }

  async eliminarRol(payload: EliminarRolPayload): Promise<EliminarRolResponse> {
    const { data } = await this.httpClient.delete<EliminarRolResponse>('/ins/roles/eliminar', {
      data: payload,
    })
    return data
  }

  async comprobarRol(payload: ComprobarRolPayload): Promise<ComprobarRolResponse> {
    const { data } = await this.httpClient.get<ComprobarRolResponse>('/ins/roles/comprobar', {
      params: payload,
    })
    return data
  }

  async consultarRolesUsuario(idUsuario: number): Promise<ConsultarRolesUsuarioResponse> {
    const { data } = await this.httpClient.get<ConsultarRolesUsuarioResponse>(
      '/ins/roles/usuario',
      { params: { id_usuario: idUsuario } }
    )
    return data
  }

  async inscribirEstudiante(payload: InscribirEstudiantePayload): Promise<InscribirEstudianteResponse> {
    const { data } = await this.httpClient.post<InscribirEstudianteResponse>(
      '/ins/inscribir',
      payload
    )
    return data
  }

  async actualizarEstadoMatricula(
    payload: ActualizarEstadoMatriculaPayload
  ): Promise<ActualizarEstadoMatriculaResponse> {
    const { data } = await this.httpClient.patch<ActualizarEstadoMatriculaResponse>(
      '/ins/inscripcion/estado',
      payload
    )
    return data
  }

  async consultarCursosEstudiante(
    payload: ConsultarCursosEstudiantePayload
  ): Promise<ConsultarCursosEstudianteResponse> {
    const { data } = await this.httpClient.get<ConsultarCursosEstudianteResponse>(
      '/ins/cursos-estudiante',
      { params: payload }
    )
    return data
  }

  async consultarTodasInscripciones(
    payload: ConsultarTodasInscripcionesPayload = {}
  ): Promise<ConsultarTodasInscripcionesResponse> {
    const { data } = await this.httpClient.get<ConsultarTodasInscripcionesResponse>(
      '/ins/inscripciones',
      { params: payload }
    )
    return data
  }

  async consultarEstadosMatricula(): Promise<ConsultarEstadosMatriculaResponse> {
    const { data } = await this.httpClient.get<ConsultarEstadosMatriculaResponse>(
      '/ins/estados-matricula'
    )
    return data
  }

  async consultarAudit(payload?: {
    pagina?: number
    usuario_filtro?: number
    tabla_filtro?: string
  }): Promise<ConsultarAuditLogsResponse> {
    const { data } = await this.httpClient.get<ConsultarAuditLogsResponse>('/ins/audit', {
      params: payload,
    })
    return data
  }
}

export const inscripcionApi = new InscripcionApi()
