import React from 'react'
import type { AsignacionItem } from '../../types/asignacion.types'

interface AsignacionesTableProps {
  items: AsignacionItem[]
}

function getBadgeClass(estado: string): string {
  switch (estado.toLowerCase()) {
    case 'inscrito':
      return 'bg-emerald-50 text-emerald-700'
    case 'aprobado':
      return 'bg-sky-50 text-sky-700'
    case 'reprobado':
      return 'bg-red-50 text-red-600'
    case 'retirado':
      return 'bg-amber-50 text-amber-700'
    default:
      return 'bg-neutral-100 text-neutral-600'
  }
}

export const AsignacionesTable: React.FC<AsignacionesTableProps> = ({ items }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-5 py-3 font-semibold">Curso</th>
              <th className="px-5 py-3 font-semibold">Sección</th>
              <th className="px-5 py-3 font-semibold">Catedrático</th>
              <th className="px-5 py-3 font-semibold">Año</th>
              <th className="px-5 py-3 font-semibold">Semestre</th>
              <th className="px-5 py-3 font-semibold">Estado Matriculación</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id_inscripcion}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
              >
                <td className="px-5 py-4 text-sm font-medium text-neutral-900">{item.curso}</td>
                <td className="px-5 py-4 text-center text-sm font-semibold text-neutral-700">
                  {item.seccion}
                </td>
                <td className="px-5 py-4 text-sm text-neutral-600">{item.catedratico}</td>
                <td className="px-5 py-4 text-center text-sm font-semibold text-neutral-700">
                  {item.anio ?? '—'}
                </td>
                <td className="px-5 py-4 text-center text-sm font-semibold text-neutral-700">
                  {item.semestre ?? '—'}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeClass(
                      item.estadoMatriculacion
                    )}`}
                  >
                    {item.estadoMatriculacion}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}