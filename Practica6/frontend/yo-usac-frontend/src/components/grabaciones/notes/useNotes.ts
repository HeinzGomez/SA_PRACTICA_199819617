import { useCallback, useEffect, useRef, useState } from 'react'
import { recursosApi } from '../../../api/res'
import type { ApunteInfo } from '../../../types/recursos.types'

const DEBOUNCE_MS = 2000

interface UseNotesResult {
  apunte: ApunteInfo | null
  contenido: string
  titulo: string
  loading: boolean
  saving: boolean
  setContenido: (value: string) => void
  setTitulo: (value: string) => void
  insertarMarcaTiempo: (segundo: number) => string
}

export function useNotes(idClase: number, idUsuario: number): UseNotesResult {
  const [apunte, setApunte] = useState<ApunteInfo | null>(null)
  const [contenido, setContenido] = useState('')
  const [titulo, setTitulo] = useState('Sin título')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contenidoRef = useRef(contenido)
  const tituloRef = useRef(titulo)
  const apunteRef = useRef(apunte)

  contenidoRef.current = contenido
  tituloRef.current = titulo
  apunteRef.current = apunte

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    recursosApi
      .consultarApunte({ id_clase: idClase, id_usuario: idUsuario })
      .then(async (res) => {
        if (cancelado) return
        if (res.apunte) {
          setApunte(res.apunte)
          setContenido(res.apunte.contenido_markdown)
          setTitulo(res.apunte.titulo)
        } else {
          const creando = await recursosApi.crearApunte({
            id_clase: idClase,
            id_usuario: idUsuario,
            titulo: 'Sin título',
            contenido_markdown: '',
          })
          if (cancelado) return
          const nuevo: ApunteInfo = {
            id_apunte: creando.id_apunte,
            id_clase: idClase,
            id_usuario: idUsuario,
            titulo: 'Sin título',
            contenido_markdown: '',
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            marcadores: [],
          }
          setApunte(nuevo)
          setTitulo(nuevo.titulo)
        }
      })
      .catch((err) => {
        if (!cancelado) {
          console.warn('No se pudieron cargar apuntes:', err)
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [idClase, idUsuario])

  const persistir = useCallback(
    async (contenidoActual: string, tituloActual: string, actual: ApunteInfo | null) => {
      setSaving(true)
      try {
        if (actual) {
          await recursosApi.actualizarApunte({
            id_apunte: actual.id_apunte,
            titulo: tituloActual,
            contenido_markdown: contenidoActual,
          })
        } else {
          const res = await recursosApi.crearApunte({
            id_clase: idClase,
            id_usuario: idUsuario,
            titulo: tituloActual || 'Sin título',
            contenido_markdown: contenidoActual,
          })
          setApunte((prev) =>
            prev ?? {
              id_apunte: res.id_apunte,
              id_clase: idClase,
              id_usuario: idUsuario,
              titulo: tituloActual || 'Sin título',
              contenido_markdown: contenidoActual,
              fecha_creacion: new Date().toISOString(),
              fecha_actualizacion: new Date().toISOString(),
              marcadores: [],
            }
          )
        }
      } catch (err) {
        console.warn('Error al guardar apuntes:', err)
      } finally {
        setSaving(false)
      }
    },
    [idClase, idUsuario]
  )

  const programarGuardado = useCallback(
    (contenidoNuevo: string, tituloNuevo: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        persistir(contenidoNuevo, tituloNuevo, apunteRef.current)
      }, DEBOUNCE_MS)
    },
    [persistir]
  )

  const handleSetContenido = useCallback(
    (value: string) => {
      setContenido(value)
      programarGuardado(value, tituloRef.current)
    },
    [programarGuardado]
  )

  const handleSetTitulo = useCallback(
    (value: string) => {
      setTitulo(value)
      programarGuardado(contenidoRef.current, value)
    },
    [programarGuardado]
  )

  const insertarMarcaTiempo = useCallback(
    (segundo: number): string => {
      const minutos = Math.floor(segundo / 60)
      const segs = Math.floor(segundo % 60)
      const marca = `[${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}]`
      const nuevo = contenidoRef.current ? `${contenidoRef.current}\n\n${marca} ` : `${marca} `
      handleSetContenido(nuevo)
      return nuevo
    },
    [handleSetContenido]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return {
    apunte,
    contenido,
    titulo,
    loading,
    saving,
    setContenido: handleSetContenido,
    setTitulo: handleSetTitulo,
    insertarMarcaTiempo,
  }
}
