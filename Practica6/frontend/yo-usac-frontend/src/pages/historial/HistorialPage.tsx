import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { historyApi } from '../../api/history'
import { grabacionesApi } from '../../api/grabaciones'
import { inscripcionApi } from '../../api/inscripcion'
import type { HistorialReproduccion } from '../../types/history.types'
import type { DetalleClaseGrabada } from '../../types/grabaciones.types'
import type { Curso } from '../../types/inscripcion.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { HistorialCard } from '../../components/grabaciones/HistorialCard'
import { Paginador } from '../../components/common/Paginador'

interface HistorialPageProps {
  onNavigate?: (path: string) => void
}

interface HistorialItem {
  registro: HistorialReproduccion
  detalle?: DetalleClaseGrabada
  cursoNombre: string
}

const SIN_RESULTADOS_MENSAJE = 'Aún no hay historial de reproducción. Reproduce una clase para registrarla aquí.'

export const HistorialPage: React.FC<HistorialPageProps> = ({ onNavigate = () => {} }) => {
  const [items, setItems] = useState<HistorialItem[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const [totalPaginas, setTotalPaginas] = useState<number>(1)

  const nombresCursos = useMemo<Map<number, string>>(
    () => new Map(cursos.map((curso) => [curso.id_curso, curso.nombre])),
    [cursos]
  )

  const enriquecerRegistros = useCallback(
    (registros: HistorialReproduccion[]): Promise<HistorialItem[]> => {
      return Promise.all(
        registros.map(async (registro): Promise<HistorialItem> => {
          let detalle: DetalleClaseGrabada | undefined
          try {
            const response = await grabacionesApi.obtenerDetalleClase(registro.id_clase)
            detalle = response.detalle
          } catch (err) {
            console.warn(`No se pudo cargar el detalle de la clase ${registro.id_clase}:`, err)
          }
          return {
            registro,
            detalle,
            cursoNombre: detalle
              ? nombresCursos.get(detalle.clase.id_curso) ?? `Curso ${detalle.clase.id_curso}`
              : `Clase ${registro.id_clase}`,
          }
        })
      )
    },
    [nombresCursos]
  )

  const cargarPagina = useCallback(
    (pagina: number) => {
      setLoading(true)
      historyApi
        .consultarHistorial({ pagina })
        .then((response) => {
          setTotalPaginas(response.total_paginas ?? 1)
          return enriquecerRegistros(response.registros ?? [])
        })
        .then((enriquecidos) => {
          setItems(enriquecidos)
        })
        .catch((err) => {
          console.warn('No se pudo cargar el historial:', err)
          setItems([])
          setTotalPaginas(1)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [enriquecerRegistros]
  )

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

  useEffect(() => {
    let cancelado = false
    historyApi
      .consultarHistorial({ pagina: 1 })
      .then((response) => {
        if (!cancelado) {
          setTotalPaginas(response.total_paginas ?? 1)
          return enriquecerRegistros(response.registros ?? [])
        }
        return []
      })
      .then((enriquecidos) => {
        if (!cancelado) {
          setItems(enriquecidos)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelado) {
          console.warn('No se pudo cargar el historial:', err)
          setItems([])
          setTotalPaginas(1)
          setLoading(false)
        }
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (pagina: number) => {
    setPaginaActual(pagina)
    cargarPagina(pagina)
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="historial" onNavigate={onNavigate} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Historial de Reproducción</h1>
          <p className="text-sm text-neutral-500">
            Aquí puedes retomar cada clase desde el minuto y segundo exactos donde te quedaste.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
            <p className="text-sm">Cargando historial de reproducción...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-neutral-500">
            {SIN_RESULTADOS_MENSAJE}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const clase = item.detalle?.clase
              const tema = item.detalle?.temas?.find(
                (t) => t.id_tema === item.registro.id_tema
              ) ?? item.detalle?.temas?.[0]
              return (
                <HistorialCard
                  key={item.registro.id_clase}
                  idClase={item.registro.id_clase}
                  curso={item.cursoNombre}
                  tema={tema?.nombre ?? clase?.titulo ?? 'Clase grabada'}
                  unidad={tema?.unidad}
                  periodo={
                    clase
                      ? `${clase.num_semestre}do Semestre ${clase.anio}`
                      : 'Periodo no disponible'
                  }
                  minutoActual={item.registro.minuto_actual}
                  segundoActual={item.registro.segundo_actual}
                  porcentajeVisto={Math.round(item.registro.porcentaje_visto)}
                  completada={item.registro.completada}
                  onClick={(id) => {
                    onNavigate(`/reproductor?id=${id}`)
                  }}
                />
              )
            })}
          </div>
        )}

        {!loading && items.length > 0 && (
          <Paginador
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onChange={handlePageChange}
          />
        )}
      </main>
    </div>
  )
}

export default HistorialPage