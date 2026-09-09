import React from 'react'

interface TimeMarkerButtonProps {
  segundoActual: number
  onInsert: (segundo: number) => void
}

const formatTime = (segundo: number): string => {
  const m = Math.floor(segundo / 60)
  const s = Math.floor(segundo % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const TimeMarkerButton: React.FC<TimeMarkerButtonProps> = ({ segundoActual, onInsert }) => {
  return (
    <button
      type="button"
      onClick={() => onInsert(segundoActual)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#9E1FFF]/30 bg-[#9E1FFF]/10 px-2.5 py-1.5 text-xs font-medium text-[#7a00c9] transition hover:bg-[#9E1FFF]/20"
      title="Insertar marca de tiempo actual"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      Marcar [{formatTime(segundoActual)}]
    </button>
  )
}
