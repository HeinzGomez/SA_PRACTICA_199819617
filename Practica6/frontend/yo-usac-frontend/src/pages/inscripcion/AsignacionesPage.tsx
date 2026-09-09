import React, { useCallback, useEffect, useState } from 'react'
import { inscripcionApi } from '../../api/inscripcion'
import { getUserId } from '../../store/session.store'
import type { CursoEstudiante } from '../../types/inscripcion.types'
import type { AsignacionItem, FiltrosAsignacion } from '../../types/asignacion.types'
import type { OpcionFiltro } from '../../types/catalogo.types'
import { Navbar } from '../../components/grabaciones/Navbar'
import { AsignacionesFilterBar } from '../../components/inscripcion/AsignacionesFilterBar'
import { AsignacionesTable } from '../../components/inscripcion/AsignacionesTable'
import { Paginador } from '../../components/common/Paginador'

interface AsignacionesPageProps {
  onNavigate?: (path: string) => void
}

const SIN_CURSOS_MENSAJE = 'No se han encontrado cursos en el período seleccionado.'

const FILTROS_INICIALES: FiltrosAsignacion = {
  anio: '',
  semestre: '',
  estadoMatriculacion: '',
}

function mapearCurso(item: CursoEstudiante): AsignacionItem {
  return {
    id_inscripcion: item.id_inscripcion,
    curso: item.curso || `Curso ${item.codigo_curso}`,
    seccion: 'A',
    catedratico: 'Catedrático USAC',
    estadoMatriculacion: item.estado_matricula || 'Matriculado',
    anio: item.anio,
    semestre: item.semestre,
  }
}

export const AsignacionesPage: React.FC<AsignacionesPageProps> = ({ onNavigate = () => {} }) => {
  const [asignaciones, setAsignaciones] = useState<AsignacionItem[]>([])
  const [totalPaginas, setTotalPaginas] = useState<number>(1)
  const [paginaActual, setPaginaActual] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [estadosMatriculacion, setEstadosMatriculacion] = useState<OpcionFiltro[]>([])

  const [filtros, setFiltros] = useState<FiltrosAsignacion>(FILTROS_INICIALES)

  useEffect(() => {
    let cancelado = false
    inscripcionApi
      .consultarEstadosMatricula()
      .then((response) => {
        if (!cancelado) {
          const estados = response.estados ?? []
          setEstadosMatriculacion(
            estados.map((estado) => ({
              value: estado.codigo,
              label: estado.nombre,
            }))
          )
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar los estados de matriculación:', err)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const consultarCursos = useCallback(
    async (
      filtrosActivos: FiltrosAsignacion,
      pagina: number
    ): Promise<{ items: AsignacionItem[]; totalPaginas: number }> => {
      const idUsuario = getUserId()
      if (!idUsuario) return { items: [], totalPaginas: 1 }

      try {
        const response = await inscripcionApi.consultarCursosEstudiante({
          id_usuario: idUsuario,
          anio: filtrosActivos.anio ? Number(filtrosActivos.anio) : 0,
          semestre: filtrosActivos.semestre ? Number(filtrosActivos.semestre) : 0,
          estado: filtrosActivos.estadoMatriculacion || '',
          pagina,
        })

        if (response.exito) {
          return {
            items: (response.registros ?? []).map(mapearCurso),
            totalPaginas: response.total_paginas ?? 1,
          }
        }
        return { items: [], totalPaginas: 1 }
      } catch (err) {
        console.warn('No se pudieron cargar los cursos del estudiante:', err)
        return { items: [], totalPaginas: 1 }
      }
    },
    []
  )

  const cargarPagina = useCallback(
    (filtrosActivos: FiltrosAsignacion, pagina: number) => {
      setLoading(true)
      consultarCursos(filtrosActivos, pagina).then(({ items, totalPaginas }) => {
        setAsignaciones(items)
        setTotalPaginas(totalPaginas)
        setLoading(false)
      })
    },
    [consultarCursos]
  )

  useEffect(() => {
    let cancelado = false
    consultarCursos(FILTROS_INICIALES, 1).then(({ items, totalPaginas }) => {
      if (!cancelado) {
        setAsignaciones(items)
        setTotalPaginas(totalPaginas)
        setLoading(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [consultarCursos])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApplyFilters = () => {
    setPaginaActual(1)
    cargarPagina(filtros, 1)
  }

  const handleClearFilters = () => {
    setFiltros(FILTROS_INICIALES)
    setPaginaActual(1)
    cargarPagina(FILTROS_INICIALES, 1)
  }

  const handleChangePagina = (pagina: number) => {
    setPaginaActual(pagina)
    cargarPagina(filtros, pagina)
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <Navbar currentTab="mis-cursos" onNavigate={onNavigate} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900">Panel Asignaciones</h1>

        <AsignacionesFilterBar
          filtros={filtros}
          onChange={handleFilterChange}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          loading={loading}
          estadosMatriculacion={estadosMatriculacion}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
            <p className="text-sm">Cargando mis cursos asignados...</p>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-neutral-500">
            {SIN_CURSOS_MENSAJE}
          </div>
        ) : (
          <>
            <AsignacionesTable items={asignaciones} />
            <Paginador
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              onChange={handleChangePagina}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default AsignacionesPage