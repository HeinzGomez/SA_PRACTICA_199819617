import { grabacionesApi } from '../api/grabaciones'
import { analiticaApi } from '../api/anal'
import type { CrearUnidadPayload, EditarUnidadPayload } from '../types/grabaciones.types'
import type {
  CrearUnidadPayload as CrearUnidadAnaliticaPayload,
  EditarUnidadPayload as EditarUnidadAnaliticaPayload,
  CrearTemaPayload as CrearTemaAnaliticaPayload,
  EditarTemaPayload as EditarTemaAnaliticaPayload,
} from '../types/analitica.types'

export interface SincronizacionResultado {
  exito: boolean
  mensaje: string
}

export class CatalogoSincronizadoService {
  async crearUnidad(payload: CrearUnidadPayload): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.crearUnidad(payload)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo crear la unidad.' }
    }

    const payloadAnalitica: CrearUnidadAnaliticaPayload = {
      nombre: payload.nombre,
      descripcion: payload.descripcion,
    }

    const resAnalitica = await analiticaApi.crearUnidad(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Unidad creada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Unidad creada y sincronizada exitosamente.' }
  }

  async editarUnidad(
    idUnidad: number,
    payload: EditarUnidadPayload
  ): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.editarUnidad(idUnidad, payload)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo editar la unidad.' }
    }

    const payloadAnalitica: EditarUnidadAnaliticaPayload = {
      id_unidad: idUnidad,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
    }

    const resAnalitica = await analiticaApi.editarUnidad(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Unidad editada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Unidad editada y sincronizada correctamente.' }
  }

  async eliminarUnidad(idUnidad: number): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.eliminarUnidad(idUnidad)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo eliminar la unidad.' }
    }

    const resAnalitica = await analiticaApi.eliminarUnidad(idUnidad)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Unidad eliminada en grabaciones pero no sincronizada en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Unidad eliminada y sincronizada del sistema.' }
  }

  async crearTema(
    idUnidad: number,
    nombre: string,
    descripcion: string
  ): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.crearTema({
      id_unidad: idUnidad,
      nombre,
      descripcion,
    })
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo crear el tema.' }
    }

    const payloadAnalitica: CrearTemaAnaliticaPayload = {
      id_unidad: idUnidad,
      nombre,
      descripcion,
    }

    const resAnalitica = await analiticaApi.crearTema(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Tema creado en grabaciones pero no sincronizado en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Tema creado y sincronizado exitosamente.' }
  }

  async editarTema(
    idTema: number,
    idUnidad: number,
    nombre: string,
    descripcion: string
  ): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.editarTema(idTema, {
      id_tema: idTema,
      id_unidad: idUnidad,
      nombre,
      descripcion,
    })
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo editar el tema.' }
    }

    const payloadAnalitica: EditarTemaAnaliticaPayload = {
      id_tema: idTema,
      id_unidad: idUnidad,
      nombre,
      descripcion,
    }

    const resAnalitica = await analiticaApi.editarTema(payloadAnalitica)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Tema editado en grabaciones pero no sincronizado en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Tema editado y sincronizado correctamente.' }
  }

  async eliminarTema(idTema: number): Promise<SincronizacionResultado> {
    const resGrabaciones = await grabacionesApi.eliminarTema(idTema)
    if (!resGrabaciones.exito) {
      return { exito: false, mensaje: resGrabaciones.mensaje || 'No se pudo eliminar el tema.' }
    }

    const resAnalitica = await analiticaApi.eliminarTema(idTema)
    if (!resAnalitica.exito) {
      return {
        exito: false,
        mensaje: `Tema eliminado en grabaciones pero no sincronizado en analítica: ${resAnalitica.mensaje}`,
      }
    }

    return { exito: true, mensaje: 'Tema eliminado y sincronizado del sistema.' }
  }
}

export const catalogoSincronizadoService = new CatalogoSincronizadoService()