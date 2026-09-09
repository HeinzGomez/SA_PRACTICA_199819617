import React from 'react'
import type { DudaInfo } from '../../../types/recursos.types'

interface DudaCardProps {
  duda: DudaInfo
  currentUserId: number | null
  puedeMarcar: boolean
  onResponder: (duda: DudaInfo) => void
  onMarcarRespuesta: (idRespuesta: number) => void
  onSeek: (segundos: number) => void
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const DudaCard: React.FC<DudaCardProps> = ({
  duda,
  currentUserId,
  puedeMarcar,
  onResponder,
  onMarcarRespuesta,
  onSeek,
}) => {
  const esAutor = currentUserId === duda.id_usuario

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9E1FFF]/10 text-xs font-bold text-[#7a00c9]">
            {duda.id_usuario}
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-900">{duda.duda}</p>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span>{duda.fecha_creacion}</span>
              {duda.segundo != null && (
                <button
                  type="button"
                  onClick={() => onSeek(duda.segundo!)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#9E1FFF]/10 px-2 py-0.5 font-medium text-[#7a00c9] transition hover:bg-[#9E1FFF]/20"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatTime(duda.segundo)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {duda.respuestas.length > 0 && (
        <div className="mb-3 flex flex-col gap-2 border-t border-neutral-100 pt-3">
          {duda.respuestas.map((respuesta) => (
            <div
              key={respuesta.id_respuesta}
              className={`flex items-start gap-3 rounded-lg p-2 ${
                respuesta.marcada ? 'bg-emerald-50' : 'bg-neutral-50'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600">
                {respuesta.id_usuario}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm text-neutral-700">{respuesta.respuesta}</p>
                <span className="text-xs text-neutral-400">{respuesta.fecha_creacion}</span>
              </div>
              {(puedeMarcar || esAutor) && (
                <button
                  type="button"
                  onClick={() => onMarcarRespuesta(respuesta.id_respuesta)}
                  disabled={respuesta.marcada}
                  title={respuesta.marcada ? 'Respuesta marcada como correcta' : 'Marcar como respuesta correcta'}
                  className={`mt-0.5 shrink-0 transition ${
                    respuesta.marcada
                      ? 'text-emerald-500'
                      : 'text-neutral-300 hover:text-emerald-500'
                  }`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill={respuesta.marcada ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onResponder(duda)}
        className="flex items-center gap-1 text-xs font-medium text-[#9E1FFF] transition hover:text-[#7a00c9]"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Responder
      </button>
    </div>
  )
}
