import React, { useState } from 'react'

interface CrearDudaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (duda: string, segundo: number) => Promise<void>
  segundoActual: number
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const CrearDudaModal: React.FC<CrearDudaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  segundoActual,
}) => {
  const [duda, setDuda] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duda.trim() || enviando) return

    setEnviando(true)
    try {
      await onSubmit(duda.trim(), Math.floor(segundoActual))
      setDuda('')
      onClose()
    } catch {
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">Preguntar en el foro</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 transition hover:text-neutral-600"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-[#9E1FFF]/5 px-3 py-2 text-sm text-[#7a00c9]">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="font-medium">Marca de tiempo: {formatTime(segundoActual)}</span>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Tu pregunta</label>
            <textarea
              value={duda}
              onChange={(e) => setDuda(e.target.value)}
              placeholder="Escribe tu duda sobre esta clase..."
              rows={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-[#9E1FFF] focus:outline-none focus:ring-1 focus:ring-[#9E1FFF]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!duda.trim() || enviando}
              className="rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'Publicando...' : 'Publicar pregunta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
