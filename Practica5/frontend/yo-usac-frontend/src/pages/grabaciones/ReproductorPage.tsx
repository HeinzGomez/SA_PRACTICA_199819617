import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { grabacionesApi } from '../../api/grabaciones'
import { inscripcionApi } from '../../api/inscripcion'
import { authApi } from '../../api/auth'
import { historyApi } from '../../api/history'
import { analiticaApi } from '../../api/anal'
import type { DetalleClaseGrabada, Capitulo } from '../../types/grabaciones.types'
import type { Curso } from '../../types/inscripcion.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { VideoEmbed } from '../../components/grabaciones/VideoEmbed'
import { ClassSidebar } from '../../components/grabaciones/ClassSidebar'
import { ClassRating } from '../../components/grabaciones/ClassRating'
import { NotesPanel } from '../../components/grabaciones/NotesPanel'
import { ChapterBar, ChapterIndex } from '../../components/grabaciones/ChapterNav'
import { getUserId } from '../../store/session.store'

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
  // HeinzGomez - estado de capítulos, marca actual y señal de salto
  const [capitulos, setCapitulos] = useState<Capitulo[]>([])
  const [segundoActual, setSegundoActual] = useState<number>(0)
  const [seekRequest, setSeekRequest] = useState<{ segundos: number; nonce: number } | undefined>(undefined)
  const seekNonce = useRef<number>(0)
  const [notesOpen, setNotesOpen] = useState(false)

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
        // HeinzGomez - cargar capítulos de la clase
        try {
          const capsRes = await grabacionesApi.consultarCapitulos(idClase)
          if (!cancelado && capsRes.exito && capsRes.capitulos) {
            setCapitulos(capsRes.capitulos)
          }
        } catch (capsError) {
          console.warn('No se pudieron cargar los capítulos:', capsError)
        }
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
      setSegundoActual(segundos) // HeinzGomez - para resaltar el capítulo activo en el índice
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

  // HeinzGomez - salto a la marca de tiempo de un capítulo
  const handleSeek = useCallback((segundos: number) => {
    seekNonce.current += 1
    setSegundoActual(segundos)
    setSeekRequest({ segundos, nonce: seekNonce.current })
  }, [])

  const cursoNombre = useMemo(
    () => cursos.find((curso) => curso.id_curso === detalle?.clase.id_curso)?.nombre ?? 'Clase Grabada',
    [cursos, detalle]
  )

  const unidadTemaNombre = detalle?.temas?.[0]?.nombre ?? detalle?.clase.titulo ?? ''

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="catalogo" onNavigate={onNavigate} />

      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 transition-all duration-300"
        style={notesOpen ? { maxWidth: 'calc(1152px + 416px)', paddingLeft: 'calc(1rem + 416px)' } : undefined}
      >
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
          <>
            {!notesOpen && (
              <button
                type="button"
                onClick={() => setNotesOpen(true)}
                className="fixed left-0 top-1/2 z-40 -translate-y-1/2 rounded-r-lg border border-l-0 border-neutral-200 bg-white px-1.5 py-3 text-neutral-500 shadow-md transition hover:bg-neutral-50 hover:text-[#9E1FFF]"
                title="Abrir apuntes"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </button>
            )}

            {notesOpen && (
              <div className="hidden lg:block fixed left-0 top-16 bottom-0 z-30 w-[400px] overflow-y-auto border-r border-neutral-200 bg-white p-4 shadow-lg">
                <NotesPanel
                  idClase={idClase}
                  idUsuario={getUserId() ?? 0}
                  segundoActual={segundoActual}
                  onSeek={handleSeek}
                  isOpen={notesOpen}
                  onToggle={() => setNotesOpen(!notesOpen)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VideoEmbed
                  url={detalle.clase.url_video}
                  title={`${cursoNombre} - ${unidadTemaNombre}`}
                  initialSeconds={segundoInicio}
                  seekRequest={seekRequest}
                  onPlaying={handlePlaying}
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                />

                <ChapterBar
                  capitulos={capitulos}
                  duracionSegundos={(detalle.clase.duracion_min ?? 0) * 60}
                  onSeek={handleSeek}
                />

                <ClassRating idClase={idClase} />
              </div>

              <div className="flex flex-col gap-6">
                <ChapterIndex capitulos={capitulos} onSeek={handleSeek} segundoActual={segundoActual} />
                <ClassSidebar 
                  docentesAuxiliares={docentes} 
                  idClase={idClase}
                  notesOpen={notesOpen}
                  onToggleNotes={() => setNotesOpen(!notesOpen)}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ReproductorPage