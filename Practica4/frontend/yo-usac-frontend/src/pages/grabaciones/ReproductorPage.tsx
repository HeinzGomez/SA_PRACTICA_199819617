import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { grabacionesApi } from '../../api/grabaciones'
import { inscripcionApi } from '../../api/inscripcion'
import { authApi } from '../../api/auth'
import { historyApi } from '../../api/history'
import { analiticaApi } from '../../api/anal'
import type { DetalleClaseGrabada, MaterialApoyo } from '../../types/grabaciones.types'
import type { Curso } from '../../types/inscripcion.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { VideoEmbed } from '../../components/grabaciones/VideoEmbed'
import { ClassSidebar } from '../../components/grabaciones/ClassSidebar'
import { ClassRating } from '../../components/grabaciones/ClassRating'

interface ReproductorPageProps {
  idClase?: number
  onNavigate?: (path: string) => void
}

export const ReproductorPage: React.FC<ReproductorPageProps> = ({
  idClase = 1,
  onNavigate = () => {},
}) => {
  const [detalle, setDetalle] = useState<DetalleClaseGrabada | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [docentes, setDocentes] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [segundoInicio, setSegundoInicio] = useState<number>(0)

  const visualizacionRegistrada = useRef<boolean>(false)
  const historialIniciado = useRef<boolean>(false)

  useEffect(() => {
    let cancelado = false
    inscripcionApi
      .consultarCursos()
      .then((response) => {
        if (!cancelado) {
          setCursos(response.cursos ?? [])
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar los cursos:', err)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const resolverDocentes = useCallback(async (participantes: DetalleClaseGrabada['participantes']) => {
    const nombres: string[] = []
    for (const participante of participantes) {
      try {
        const response = await authApi.consultarUsuario(participante.id_usuario)
        const usuario = response.usuario
        if (usuario) {
          nombres.push(`${usuario.nombre} ${usuario.apellido}`.trim())
        }
      } catch (err) {
        console.warn(`No se pudo resolver el usuario ${participante.id_usuario}:`, err)
      }
    }
    return nombres
  }, [])

  useEffect(() => {
    let cancelado = false
    const fetchDetalle = async () => {
      setLoading(true)
      setError(null)
      visualizacionRegistrada.current = false
      historialIniciado.current = false
      try {
        const response = await grabacionesApi.obtenerDetalleClase(idClase)
        if (!response.detalle) {
          throw new Error(response.mensaje || 'No se encontró la clase')
        }
        const docentesNombres = await resolverDocentes(response.detalle.participantes)
        if (cancelado) return
        setDetalle(response.detalle)
        setDocentes(docentesNombres)
        try {
          const checkpoint = await historyApi.obtenerCheckpointClase(idClase)
          const checkpointData = checkpoint.checkpoint
          if (checkpointData) {
            setSegundoInicio(checkpointData.minuto_actual * 60 + checkpointData.segundo_actual)
          }
        } catch (checkpointError) {
          console.warn('No se pudo obtener el checkpoint de la clase:', checkpointError)
        }
      } catch (err) {
        console.warn('No se pudo cargar el detalle de la clase:', err)
        if (!cancelado) {
          setError(
            err instanceof Error ? err.message : 'No se pudo cargar la información de la clase'
          )
        }
      } finally {
        if (!cancelado) {
          setLoading(false)
        }
      }
    }

    fetchDetalle()
    return () => {
      cancelado = true
    }
  }, [idClase, resolverDocentes])

  const handlePlaying = useCallback(() => {
    if (visualizacionRegistrada.current) return
    visualizacionRegistrada.current = true
    analiticaApi
      .visualizarClase({ id_clase: idClase })
      .catch((err) => {
        console.warn('No se pudo registrar la visualización:', err)
      })
  }, [idClase])

  const handleProgress = useCallback(
    (segundos: number, duracionSegundos: number) => {
      const idTema = detalle?.temas?.[0]?.id_tema ?? 0
      const minutoActual = Math.floor(segundos / 60)
      const segundoActual = Math.floor(segundos % 60)
      const duracionMinutos = Math.max(1, Math.round(duracionSegundos / 60))
      if (!historialIniciado.current) {
        historialIniciado.current = true
        historyApi
          .registrarProgreso({
            id_clase: idClase,
            id_tema: idTema,
            minuto_actual: minutoActual,
            segundo_actual: segundoActual,
            duracion_total: duracionMinutos,
          })
          .catch(() => {
            historialIniciado.current = false
          })
        return
      }
      historyApi
        .actualizarCheckpoint({
          id_clase: idClase,
          id_tema: idTema,
          minuto_actual: minutoActual,
          segundo_actual: segundoActual,
        })
        .catch((err) => {
          console.warn('No se pudo actualizar el checkpoint:', err)
        })
    },
    [idClase, detalle]
  )

  const handleEnded = useCallback(() => {
    historyApi
      .marcarClaseCompletada(idClase)
      .catch((err) => {
        console.warn('No se pudo marcar la clase como completada:', err)
      })
  }, [idClase])

  const cursoNombre = useMemo(
    () => cursos.find((curso) => curso.id_curso === detalle?.clase.id_curso)?.nombre ?? 'Clase Grabada',
    [cursos, detalle]
  )

  const unidadTemaNombre = detalle?.temas?.[0]?.nombre ?? detalle?.clase.titulo ?? ''

  const materiales: MaterialApoyo[] = detalle?.materiales ?? []

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="catalogo" onNavigate={onNavigate} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-col items-start gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
            onClick={() => onNavigate('/catalogo')}
          >
            <span aria-hidden="true">←</span> Volver al Catálogo
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{cursoNombre}</h1>
            <h2 className="text-neutral-600">{unidadTemaNombre}</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
            <p className="text-sm">Cargando reproductor de clase...</p>
          </div>
        ) : error || !detalle ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            {error ?? 'No se encontró la clase'}
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <VideoEmbed
                url={detalle.clase.url_video}
                title={`${cursoNombre} - ${unidadTemaNombre}`}
                initialSeconds={segundoInicio}
                onPlaying={handlePlaying}
                onProgress={handleProgress}
                onEnded={handleEnded}
              />

              <ClassRating idClase={idClase} />
            </div>

            <ClassSidebar docentesAuxiliares={docentes} materiales={materiales} />
          </div>
        )}
      </main>
    </div>
  )
}

export default ReproductorPage