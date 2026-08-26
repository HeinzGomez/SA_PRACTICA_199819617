import { grabacionesApi } from '../api/grabaciones'
import { analiticaApi } from '../api/anal'
import type {
  CrearClaseGrabadaPayload,
  EditarClaseGrabadaPayload,
  ClaseCargaInput,
} from '../types/grabaciones.types'
import type {
  CrearClaseGrabadaPayload as CrearClaseAnaliticaPayload,
  EditarClaseGrabadaPayload as EditarClaseAnaliticaPayload,
  BatchCrearClaseResult as BatchAnaliticaResult,
} from '../types/analitica.types'

export interface SincronizacionResultado {
  exito: boolean
  mensaje: string
  resultados?: BatchAnaliticaResult[]
}

export class ClasesSincronizadasService {
  async crearClaseGrabada(payload: CrearClaseGrabadaPayload): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.crearClaseGrabada(payload)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo crear la clase grabada.' }
    }

    const payloadAnalitica: CrearClaseAnaliticaPayload = {
      id_curso: payload.id_curso,
      id_periodo: payload.id_periodo,
      id_area: payload.id_area,
      titulo: payload.titulo,
      fecha_impartida: payload.fecha_impartida,
      duracion_min: payload.duracion_min,
      descripcion: payload.descripcion ?? '',
      url_video: payload.url_video ?? '',
      anio: payload.anio ?? 0,
      num_semestre: payload.num_semestre ?? 0,
    }

    const resAnalitica = await analiticaApi.crearClaseGrabada(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Clase creada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Nueva clase grabada añadida y sincronizada exitosamente.' }
  }

  async editarClaseGrabada(
    idClase: number,
    payload: EditarClaseGrabadaPayload
  ): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.editarClaseGrabada(idClase, payload)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo editar la clase grabada.' }
    }

    const payloadAnalitica: EditarClaseAnaliticaPayload = {
      id_clase: idClase,
      id_curso: payload.id_curso,
      id_periodo: payload.id_periodo,
      id_area: payload.id_area,
      titulo: payload.titulo,
      fecha_impartida: payload.fecha_impartida,
      duracion_min: payload.duracion_min,
      descripcion: payload.descripcion ?? '',
      url_video: payload.url_video ?? '',
      anio: payload.anio ?? 0,
      num_semestre: payload.num_semestre ?? 0,
    }

    const resAnalitica = await analiticaApi.editarClaseGrabada(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Clase editada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Clase grabada editada y sincronizada correctamente.' }
  }

  async eliminarClaseGrabada(idClase: number): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.eliminarClaseGrabada(idClase)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo eliminar la clase grabada.' }
    }

    const resAnalitica = await analiticaApi.eliminarClaseGrabada(idClase)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Clase eliminada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Clase grabada eliminada y sincronizada del sistema.' }
  }

  async asignarTemaClaseGrabada(idClase: number, idTema: number): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.asignarTemaClaseGrabada(idClase, idTema)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo asociar el tema a la clase.' }
    }

    const resAnalitica = await analiticaApi.asignarTemaClaseGrabada({
      id_clase: idClase,
      id_tema: idTema,
    })
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Tema asociado en grabaciones pero no sincronizado en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Tema asociado a la clase y sincronizado.' }
  }

  async desasignarTemaClaseGrabada(
    idClase: number,
    idTema: number
  ): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.desasignarTemaClaseGrabada(idClase, idTema)
    if (!resGrabaciones.exito) {
      return {
        exito: false,
        mensaje: resGrabaciones.mensaje || 'No se pudo desasociar el tema de la clase.',
      }
    }

    const resAnalitica = await analiticaApi.desasignarTemaClaseGrabada(idClase, idTema)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Tema desasociado en grabaciones pero no sincronizado en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Tema desasociado de la clase y sincronizado.' }
  }

  async cargaMasivaClases(items: ClaseCargaInput[]): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.cargaMasivaClases(items)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'Error en carga masiva.' }
    }

    const resAnalitica = await analiticaApi.cargaMasivaClases(items)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Carga masiva procesada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return {
      exito: true,
      mensaje: 'Carga masiva procesada y sincronizada. Revisa resultados en consola.',
      resultados: resAnalitica.resultados,
    }
  }
}

export const clasesSincronizadasService = new ClasesSincronizadasService()
