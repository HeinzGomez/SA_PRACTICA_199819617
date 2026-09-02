import React from 'react'
import type { FiltrosAsignacion } from '../../types/asignacion.types'
import type { OpcionFiltro } from '../../types/catalogo.types'

interface AsignacionesFilterBarProps {
  filtros: FiltrosAsignacion
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  loading?: boolean
  estadosMatriculacion?: OpcionFiltro[]
}

const selectClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-[#9E1FFF] focus:ring-2 focus:ring-[#9E1FFF]/20'

export const AsignacionesFilterBar: React.FC<AsignacionesFilterBarProps> = ({
  filtros,
  onChange,
  onApplyFilters,
  onClearFilters,
  loading = false,
  estadosMatriculacion = [],
}) => {
  const hasFilters = Boolean(filtros.anio || filtros.semestre || filtros.estadoMatriculacion)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select name="anio" value={filtros.anio} onChange={onChange} className={selectClass}>
          <option value="">Año</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>

        <select
          name="semestre"
          value={filtros.semestre}
          onChange={onChange}
          className={selectClass}
        >
          <option value="">Semestre</option>
          <option value="1">1er Semestre</option>
          <option value="2">2do Semestre</option>
          <option value="3">Vacaciones Junio</option>
          <option value="4">Vacaciones Diciembre</option>
        </select>

        <select
          name="estadoMatriculacion"
          value={filtros.estadoMatriculacion}
          onChange={onChange}
          className={selectClass}
        >
          <option value="">Estado Matriculación</option>
          {estadosMatriculacion.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            disabled={loading}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpiar
          </button>
        )}
        <button
          type="button"
          onClick={onApplyFilters}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Filtrando...' : 'Aplicar Filtros'}
        </button>
      </div>
    </div>
  )
}