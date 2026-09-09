import React, { useState, useEffect } from 'react'
import { analiticaApi } from '../../api/anal'
import type { ClaseMasVista, ClaseValorada, TemaTendencia } from '../../types/admin.types'

interface AnaliticaDashboardProps {
  clasesMasVistas?: ClaseMasVista[]
  temasTendencia?: TemaTendencia[]
  clasesMejorValoradas?: ClaseValorada[]
}

export const AnaliticaDashboard: React.FC<AnaliticaDashboardProps> = ({
  clasesMasVistas: initialMasVistas = [],
  temasTendencia: initialTendencia = [],
  clasesMejorValoradas: initialValoradas = [],
}) => {
  const [loading, setLoading] = useState(false)
  const [clasesMasVistas, setClasesMasVistas] = useState<ClaseMasVista[]>(initialMasVistas)
  const [temasTendencia, setTemasTendencia] = useState<TemaTendencia[]>(initialTendencia)
  const [clasesMejorValoradas, setClasesMejorValoradas] = useState<ClaseValorada[]>(initialValoradas)

  // Filters
  const [limiteRanking, setLimiteRanking] = useState<number>(10)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [resVistas, resTendencia, resRanking] = await Promise.all([
        analiticaApi.consultarClasesMasVistas({
          limite: limiteRanking,
        }),
        analiticaApi.consultarTemasTendencia({
          limite: limiteRanking,
        }),
        analiticaApi.consultarRankingValoradas({ limite: limiteRanking }),
      ])

      if (resVistas.exito && resVistas.registros) {
        setClasesMasVistas(
          resVistas.registros.map((item: any, idx: number) => ({
            id: item.id_clase ?? idx + 1,
            titulo: item.titulo || `Clase #${item.id_clase}`,
            total_vistas: Number(item.total_visualizaciones ?? 0),
          }))
        )
      }

      if (resTendencia.exito && resTendencia.registros) {
        setTemasTendencia(
          resTendencia.registros.map((t: any, idx: number) => ({
            id: t.id_tema ?? idx + 1,
            nombre: t.nombre || `Tema #${t.id_tema}`,
            total_consultas: Number(t.total_visualizaciones ?? 0),
          }))
        )
      }

      if (resRanking.exito && resRanking.registros) {
        setClasesMejorValoradas(
          resRanking.registros.map((r: any, idx: number) => ({
            id: r.id_clase ?? idx + 1,
            clase: r.titulo || `Clase #${r.id_clase}`,
            curso: '',
            catedratico: '',
            calificacion: Number(r.promedio_calificacion ?? 0),
          }))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAnalytics()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Toolbar */}
      <form
        onSubmit={handleApplyFilters}
        className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm text-xs"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Límite Ranking</label>
            <input
              type="number"
              value={limiteRanking}
              onChange={(e) => setLimiteRanking(Number(e.target.value))}
              className="w-24 rounded-lg border border-neutral-300 px-3 py-1.5 outline-none focus:border-[#9E1FFF]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#9E1FFF] px-5 py-2 font-semibold text-white transition hover:bg-[#7a00c9] shadow-sm"
        >
          {loading ? 'Filtrando...' : 'Aplicar Filtros'}
        </button>
      </form>

      {/* Grid 2 Cols */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Clases Más Vistas
            </h2>
            <span className="text-[11px] font-semibold text-[#9E1FFF] bg-purple-50 px-2 py-0.5 rounded-full">
              Top Popularidad
            </span>
          </div>
          <ol className="flex flex-col gap-2.5">
            {clasesMasVistas.map((item, idx) => (
              <li key={item.id} className="flex items-center justify-between text-xs text-neutral-700">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9E1FFF]/10 text-xs font-bold text-[#7a00c9]">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-neutral-900">{item.titulo}</span>
                </div>
                {item.total_vistas !== undefined && (
                  <span className="font-mono text-neutral-400 text-[11px]">
                    {item.total_vistas} vistas
                  </span>
                )}
              </li>
            ))}
            {clasesMasVistas.length === 0 && (
              <p className="text-center text-xs text-neutral-400 py-4">No hay registros de vistas.</p>
            )}
          </ol>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              Temas con Mayor Tendencia
            </h2>
            <span className="text-[11px] font-semibold text-[#9E1FFF] bg-purple-50 px-2 py-0.5 rounded-full">
              🔥 Tendencias
            </span>
          </div>
          <ol className="flex flex-col gap-2.5">
            {temasTendencia.map((tema, idx) => (
              <li key={tema.id} className="flex items-center justify-between text-xs text-neutral-700">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9E1FFF]/10 text-xs font-bold text-[#7a00c9]">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-neutral-900">{tema.nombre}</span>
                </div>
                {tema.total_consultas !== undefined && (
                  <span className="font-mono text-neutral-400 text-[11px]">
                    {tema.total_consultas} búsquedas
                  </span>
                )}
              </li>
            ))}
            {temasTendencia.length === 0 && (
              <p className="text-center text-xs text-neutral-400 py-4">No hay tendencias registradas.</p>
            )}
          </ol>
        </div>
      </div>

      {/* Table Clases Mejor Valoradas */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Ranking de Clases Mejor Valoradas
          </h2>
          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
            ★ Calificaciones
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 uppercase tracking-wide text-neutral-500 font-medium">
                <th className="px-5 py-3">Clase</th>
                <th className="px-5 py-3 text-right">Calificación Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clasesMejorValoradas.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-4 font-medium text-neutral-900">{row.clase}</td>
                  <td className="px-5 py-4 text-right font-bold text-neutral-900">
                    <span className="mr-1 text-amber-400 text-sm">★</span>
                    {row.calificacion.toFixed(1)}
                  </td>
                </tr>
              ))}
              {clasesMejorValoradas.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-neutral-400 text-xs">
                    No hay información de ranking disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}