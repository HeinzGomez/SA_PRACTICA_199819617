import React from 'react'

interface HistorialCardProps {
  idClase: number
  curso: string
  tema: string
  unidad?: string
  periodo: string
  minutoActual: number
  segundoActual: number
  porcentajeVisto: number
  completada?: boolean
  onClick?: (idClase: number) => void
}

const formatearCheckpoint = (minuto: number, segundo: number): string =>
  `${String(minuto).padStart(2, '0')}:${String(segundo).padStart(2, '0')}`

export const HistorialCard: React.FC<HistorialCardProps> = ({
  idClase,
  curso,
  tema,
  unidad,
  periodo,
  minutoActual,
  segundoActual,
  porcentajeVisto,
  completada,
  onClick,
}) => {
  const handleClick = () => onClick && onClick(idClase)

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-[#9E1FFF] hover:shadow-md"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleClick()
      }}
    >
      <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[#9E1FFF] to-[#2E1FFF]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white transition group-hover:scale-110">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {completada && (
          <span className="absolute top-2 right-2 rounded-md bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white">
            Completada
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          {porcentajeVisto}% visto
        </span>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-bold text-neutral-900">{curso}</h3>
        {unidad && <p className="text-xs font-semibold text-[#9E1FFF]">{unidad}</p>}
        <p className="text-sm text-neutral-600">{tema}</p>

        <span className="mt-2 inline-flex self-start rounded-full bg-[#9E1FFF]/10 px-3 py-1 text-xs font-semibold text-[#7a00c9]">
          {periodo}
        </span>

        <div className="mt-2 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-8.26V8a1 1 0 0 0-2 0v4a1 1 0 0 0 .58.91l3 1.5a1 1 0 1 0 .84-1.82L13 11.74z" />
            </svg>
            Reanudar en
          </div>
          <span className="font-mono text-sm font-semibold text-[#7a00c9]">
            {formatearCheckpoint(minutoActual, segundoActual)}
          </span>
        </div>
      </div>
    </div>
  )
}