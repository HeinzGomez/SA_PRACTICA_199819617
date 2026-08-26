import React, { useEffect, useMemo, useState } from 'react'
import { grabacionesApi } from '../../api/grabaciones'
import { inscripcionApi } from '../../api/inscripcion'
import type { CatalogoClase } from '../../types/grabaciones.types'
import type { Area, Curso } from '../../types/inscripcion.types'
import type { FiltrosCatalogo, OpcionFiltro } from '../../types/catalogo.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { FilterBar } from '../../components/grabaciones/FilterBar'
import { ClaseCard } from '../../components/grabaciones/ClaseCard'
import { Paginador } from '../../components/common/Paginador'

interface CatalogoPageProps {
  onNavigate?: (path: string) => void
}

const SIN_RESULTADOS_MENSAJE = 'No se encontraron clases grabadas que coincidan con tu búsqueda.'

const FILTROS_INICIALES: FiltrosCatalogo = {
  anio: '',
  semestre: '',
  area: '',
  curso: '',
}

interface ResultadoClases {
  registros: CatalogoClase[]
  totalPaginas: number
}

export const CatalogoPage: React.FC<CatalogoPageProps> = ({ onNavigate = () => {} }) => {
  const [clases, setClases] = useState<CatalogoClase[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [areas, setAreas] = useState<Area[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const [totalPaginas, setTotalPaginas] = useState<number>(1)

  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_INICIALES)

  const nombresCursos = useMemo<Map<number, string>>(
    () => new Map(cursos.map((curso) => [curso.id_curso, curso.nombre])),
    [cursos]
  )

  const opcionesCurso = useMemo<OpcionFiltro[]>(
    () => cursos.map((curso) => ({ value: String(curso.id_curso), label: curso.nombre })),
    [cursos]
  )

  const opcionesArea = useMemo<OpcionFiltro[]>(
    () => areas.map((area) => ({ value: String(area.id_area), label: area.nombre })),
    [areas]
  )

  const esBusquedaFiltrada = useMemo<boolean>(
    () =>
      filtros.anio !== '' ||
      filtros.semestre !== '' ||
      filtros.area !== '' ||
      filtros.curso !== '',
    [filtros]
  )

  const obtenerClases = (pagina: number, filtrada: boolean): Promise<ResultadoClases> => {
    if (filtrada) {
      return grabacionesApi
        .busquedaAvanzada({
          anio: filtros.anio ? Number(filtros.anio) : 0,
          semestre: filtros.semestre ? Number(filtros.semestre) : 0,
          id_area: filtros.area ? Number(filtros.area) : 0,
          id_curso: filtros.curso ? Number(filtros.curso) : 0,
          id_docente: 0,
          id_tema: 0,
          pagina,
        })
        .then((response) => ({
          registros: response.registros ?? [],
          totalPaginas: response.total_paginas ?? 1,
        }))
    }
    return grabacionesApi
      .consultarCatalogoClases(pagina)
      .then((response) => ({
        registros: response.registros ?? [],
        totalPaginas: response.total_paginas ?? 1,
      }))
  }

  const cargarPagina = (pagina: number, filtrada: boolean) => {
    setLoading(true)
    obtenerClases(pagina, filtrada)
      .then((resultado) => {
        setClases(resultado.registros)
        setTotalPaginas(resultado.totalPaginas)
      })
      .catch((err) => {
        console.warn('No se pudo cargar el catálogo de clases:', err)
        setClases([])
        setTotalPaginas(1)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    let cancelado = false
    inscripcionApi
      .consultarAreas()
      .then((response) => {
        if (!cancelado) {
          setAreas(response.areas ?? [])
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar las áreas:', err)
      })
    return () => {
      cancelado = true
    }
  }, [])

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
    obtenerClases(1, false).then((resultado) => {
      if (!cancelado) {
        setClases(resultado.registros)
        setTotalPaginas(resultado.totalPaginas)
        setLoading(false)
      }
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyFilters = () => {
    setPaginaActual(1)
    cargarPagina(1, esBusquedaFiltrada)
  }

  const handleClearFilters = () => {
    setFiltros(FILTROS_INICIALES)
    setPaginaActual(1)
    cargarPagina(1, false)
  }

  const handlePageChange = (pagina: number) => {
    setPaginaActual(pagina)
    cargarPagina(pagina, esBusquedaFiltrada)
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="catalogo" onNavigate={onNavigate} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900">Catálogo de Clases Grabadas</h1>

        <FilterBar
          filtros={filtros}
          onChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          loading={loading}
          areas={opcionesArea}
          cursos={opcionesCurso}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
            <p className="text-sm">Cargando clases grabadas...</p>
          </div>
        ) : clases.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            {SIN_RESULTADOS_MENSAJE}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clases.map((clase) => (
              <ClaseCard
                key={clase.id_clase}
                idClase={clase.id_clase}
                curso={nombresCursos.get(clase.id_curso) ?? `Curso ${clase.id_curso}`}
                tema={clase.titulo}
                periodo={`${clase.num_semestre}do Semestre ${clase.anio}`}
                duracionMin={clase.duracion_min}
                urlVideo={clase.url_video}
                onClick={(id) => {
                  onNavigate(`/reproductor?id=${id}`)
                }}
              />
            ))}
          </div>
        )}

        {!loading && clases.length > 0 && (
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

export default CatalogoPage