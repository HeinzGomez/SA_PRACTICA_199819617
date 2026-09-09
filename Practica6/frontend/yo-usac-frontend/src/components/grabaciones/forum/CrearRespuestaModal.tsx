import React, { useState } from 'react'

interface CrearRespuestaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (respuesta: string) => Promise<void>
  dudaTexto: string
}

export const CrearRespuestaModal: React.FC<CrearRespuestaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dudaTexto,
}) => {
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!respuesta.trim() || enviando) return

    setEnviando(true)
    try {
      await onSubmit(respuesta.trim())
      setRespuesta('')
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
          <h3 className="text-lg font-bold text-neutral-900">Responder duda</h3>
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

        <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-700">Pregunta: </span>
          {dudaTexto}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Tu respuesta</label>
            <textarea
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Escribe tu respuesta..."
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
              disabled={!respuesta.trim() || enviando}
              className="rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'Enviando...' : 'Enviar respuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
