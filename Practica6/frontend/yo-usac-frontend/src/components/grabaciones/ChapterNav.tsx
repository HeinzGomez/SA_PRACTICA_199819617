// HeinzGomez - Componentes de navegación por capítulos: barra segmentada e índice lateral
import React, { useMemo } from 'react'
import type { Capitulo } from '../../types/grabaciones.types'
import { formatearTiempo } from '../../utils/tiempo'

interface ChapterBarProps {
  capitulos: Capitulo[]
  duracionSegundos: number
  onSeek: (segundos: number) => void
}

// HeinzGomez - Barra de avance dividida visualmente según los capítulos definidos
export const ChapterBar: React.FC<ChapterBarProps> = ({ capitulos, duracionSegundos, onSeek }) => {
  const segmentos = useMemo(() => {
    if (capitulos.length === 0) return []
    const ordenados = [...capitulos].sort((a, b) => a.tiempo_inicio - b.tiempo_inicio)
    const ultimo = ordenados[ordenados.length - 1].tiempo_inicio
    const total = duracionSegundos > 0 ? duracionSegundos : ultimo + 1
    return ordenados.map((cap, idx) => {
      const inicio = cap.tiempo_inicio
      const fin = idx < ordenados.length - 1 ? ordenados[idx + 1].tiempo_inicio : total
      const ancho = Math.max(2, ((fin - inicio) / total) * 100)
      return { cap, ancho }
    })
  }, [capitulos, duracionSegundos])

  if (segmentos.length === 0) return null

  return (
    <div className="mt-3">
      <div className="flex w-full gap-[2px] overflow-hidden rounded-full">
        {segmentos.map(({ cap, ancho }) => (
          <button
            key={cap.id_capitulo}
            type="button"
            title={`${formatearTiempo(cap.tiempo_inicio)} · ${cap.titulo}`}
            onClick={() => onSeek(cap.tiempo_inicio)}
            style={{ width: `${ancho}%` }}
            className="group h-2.5 bg-neutral-200 transition hover:bg-[#9E1FFF]"
          >
            <span className="sr-only">{cap.titulo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface ChapterIndexProps {
  capitulos: Capitulo[]
  onSeek: (segundos: number) => void
  segundoActual?: number
}

// HeinzGomez - Índice lateral desplegable para saltar directo a un tema
export const ChapterIndex: React.FC<ChapterIndexProps> = ({ capitulos, onSeek, segundoActual = 0 }) => {
  const ordenados = useMemo(
    () => [...capitulos].sort((a, b) => a.tiempo_inicio - b.tiempo_inicio),
    [capitulos]
  )

  const indiceActivo = useMemo(() => {
    let activo = -1
    ordenados.forEach((cap, idx) => {
      if (segundoActual >= cap.tiempo_inicio) activo = idx
    })
    return activo
  }, [ordenados, segundoActual])

  if (ordenados.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Capítulos</h3>
      <ul className="flex flex-col gap-1">
        {ordenados.map((cap, idx) => (
          <li key={cap.id_capitulo}>
            <button
              type="button"
              onClick={() => onSeek(cap.tiempo_inicio)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                idx === indiceActivo
                  ? 'bg-[#9E1FFF]/10 text-[#7a00c9]'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="font-mono text-xs text-[#7a00c9]">{formatearTiempo(cap.tiempo_inicio)}</span>
              <span className="truncate">{cap.titulo}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
