// HeinzGomez - Modal de gestión de capítulos (herramienta del panel admin para segmentar clases)
import React, { useEffect, useState } from 'react'
import { grabacionesApi } from '../../api/grabaciones'
import type { Capitulo } from '../../types/grabaciones.types'
import type { ClaseGrabadaItem } from '../../types/admin.types'
import { formatearTiempo, parsearTiempo } from '../../utils/tiempo'

interface CapitulosModalProps {
  clase: ClaseGrabadaItem
  onClose: () => void
}

export const CapitulosModal: React.FC<CapitulosModalProps> = ({ clase, onClose }) => {
  const [capitulos, setCapitulos] = useState<Capitulo[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [titulo, setTitulo] = useState('')
  const [tiempo, setTiempo] = useState('00:00')
  const [editando, setEditando] = useState<Capitulo | null>(null)

  const duracionSegundos = (clase.duracion_min ?? 0) * 60

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await grabacionesApi.consultarCapitulos(clase.id_clase)
      if (res.exito && res.capitulos) {
        setCapitulos([...res.capitulos].sort((a, b) => a.tiempo_inicio - b.tiempo_inicio))
      }
    } catch {
      setMessage({ type: 'error', text: 'No se pudieron cargar los capítulos.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clase.id_clase])

  const limpiarFormulario = () => {
    setTitulo('')
    setTiempo('00:00')
    setEditando(null)
  }

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const segundos = parsearTiempo(tiempo)
    if (segundos === null) {
      setMessage({ type: 'error', text: 'La marca de tiempo debe tener formato MM:SS o H:MM:SS.' })
      return
    }
    if (duracionSegundos > 0 && segundos > duracionSegundos) {
      setMessage({
        type: 'error',
        text: `La marca (${formatearTiempo(segundos)}) excede la duración de la clase (${formatearTiempo(duracionSegundos)}).`,
      })
      return
    }
    if (!titulo.trim()) {
      setMessage({ type: 'error', text: 'El título del capítulo es obligatorio.' })
      return
    }

    try {
      const res = editando
        ? await grabacionesApi.editarCapitulo(editando.id_capitulo, {
            titulo: titulo.trim(),
            tiempo_inicio: segundos,
          })
        : await grabacionesApi.crearCapitulo(clase.id_clase, {
            titulo: titulo.trim(),
            tiempo_inicio: segundos,
          })

      if (!res.exito) {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo guardar el capítulo.' })
        return
      }
      setMessage({ type: 'success', text: editando ? 'Capítulo actualizado.' : 'Capítulo creado.' })
      limpiarFormulario()
      await cargar()
    } catch {
      setMessage({ type: 'error', text: 'Ocurrió un error al guardar el capítulo.' })
    }
  }

  const handleEditar = (cap: Capitulo) => {
    setEditando(cap)
    setTitulo(cap.titulo)
    setTiempo(formatearTiempo(cap.tiempo_inicio))
    setMessage(null)
  }

  const handleEliminar = async (cap: Capitulo) => {
    setMessage(null)
    try {
      const res = await grabacionesApi.eliminarCapitulo(cap.id_capitulo)
      if (!res.exito) {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo eliminar el capítulo.' })
        return
      }
      if (editando?.id_capitulo === cap.id_capitulo) limpiarFormulario()
      await cargar()
    } catch {
      setMessage({ type: 'error', text: 'Ocurrió un error al eliminar el capítulo.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Capítulos de la clase</h2>
            <p className="text-sm text-neutral-500">
              {clase.titulo}
              {clase.duracion_min ? ` · duración ${formatearTiempo(duracionSegundos)}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleGuardar} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del capítulo (ej. Fundamentos teóricos)"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#9E1FFF] focus:outline-none"
            />
            <input
              type="text"
              value={tiempo}
              onChange={(e) => setTiempo(e.target.value)}
              placeholder="MM:SS"
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-center font-mono text-sm focus:border-[#9E1FFF] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#9E1FFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7a00c9]"
            >
              {editando ? 'Actualizar' : 'Agregar'}
            </button>
          </form>
          {editando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="self-start text-xs font-medium text-neutral-500 hover:underline"
            >
              Cancelar edición
            </button>
          )}

          <div className="mt-2">
            {loading ? (
              <p className="py-6 text-center text-sm text-neutral-400">Cargando capítulos...</p>
            ) : capitulos.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">
                Esta clase todavía no tiene capítulos.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {capitulos.map((cap) => (
                  <li key={cap.id_capitulo} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-16 font-mono text-xs text-[#7a00c9]">
                      {formatearTiempo(cap.tiempo_inicio)}
                    </span>
                    <span className="flex-1 truncate text-sm text-neutral-700">{cap.titulo}</span>
                    <button
                      type="button"
                      onClick={() => handleEditar(cap)}
                      className="text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(cap)}
                      className="text-sm font-semibold text-rose-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
