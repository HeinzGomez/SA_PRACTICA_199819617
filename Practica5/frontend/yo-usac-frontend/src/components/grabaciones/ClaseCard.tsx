import React from 'react'

interface ClaseCardProps {
  idClase: number
  curso: string
  tema: string
  periodo: string
  catedratico?: string
  duracionMin?: number
  urlVideo?: string
  onClick?: (idClase: number) => void
}

export const ClaseCard: React.FC<ClaseCardProps> = ({
  idClase,
  curso,
  tema,
  periodo,
  catedratico,
  duracionMin,
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
        {duracionMin !== undefined && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            {duracionMin} min
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-bold text-neutral-900">{curso}</h3>
        <p className="text-sm text-neutral-600">{tema}</p>
        {catedratico && <p className="text-xs text-neutral-500">Catedrático: {catedratico}</p>}
        <span className="mt-2 inline-flex self-start rounded-full bg-[#9E1FFF]/10 px-3 py-1 text-xs font-semibold text-[#7a00c9]">
          {periodo}
        </span>
      </div>
    </div>
  )
}