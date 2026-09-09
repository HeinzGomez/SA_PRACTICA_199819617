import React, { useCallback, useEffect, useState } from 'react'
import { recursosApi } from '../../../api/res'
import { inscripcionApi } from '../../../api/inscripcion'
import { getUserId } from '../../../store/session.store'
import type { DudaInfo } from '../../../types/recursos.types'
import { DudaCard } from './DudaCard'
import { CrearDudaModal } from './CrearDudaModal'
import { CrearRespuestaModal } from './CrearRespuestaModal'

interface ForumSectionProps {
  idClase: number
  segundoActual: number
  onSeek: (segundos: number) => void
}

export const ForumSection: React.FC<ForumSectionProps> = ({ idClase, segundoActual, onSeek }) => {
  const [dudas, setDudas] = useState<DudaInfo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalDudaAbierto, setModalDudaAbierto] = useState(false)
  const [dudaSeleccionada, setDudaSeleccionada] = useState<DudaInfo | null>(null)
  const [puedeMarcar, setPuedeMarcar] = useState(false)

  const currentUserId = getUserId()

  const cargarDudas = useCallback(async () => {
    try {
      setCargando(true)
      setError(null)
      const response = await recursosApi.consultarDudasClase({ id_clase: idClase, pagina: 1 })
      setDudas(response.dudas ?? [])
    } catch (err) {
      console.warn('No se pudieron cargar las dudas:', err)
      setError('No se pudieron cargar las dudas del foro')
    } finally {
      setCargando(false)
    }
  }, [idClase])

  useEffect(() => {
    cargarDudas()
  }, [cargarDudas])

  useEffect(() => {
    if (!currentUserId) return
    let cancelado = false
    inscripcionApi
      .consultarRolesUsuario(currentUserId)
      .then((res) => {
        if (cancelado) return
        const roles = res.roles ?? []
        const esDocenteAuxiliar = roles.some(
          (r) => r.rol === 'Docente' || r.rol === 'Auxiliar'
        )
        setPuedeMarcar(esDocenteAuxiliar)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [currentUserId])

  const handleCrearDuda = async (duda: string, segundo: number) => {
    await recursosApi.crearDuda({ id_clase: idClase, duda, segundo })
    await cargarDudas()
  }

  const handleCrearRespuesta = async (respuesta: string) => {
    if (!dudaSeleccionada) return
    await recursosApi.crearRespuesta({ id_duda: dudaSeleccionada.id_dudas, respuesta })
    await cargarDudas()
  }

  const handleMarcarRespuesta = async (idRespuesta: number) => {
    await recursosApi.marcarRespuesta(idRespuesta)
    await cargarDudas()
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Foro de dudas
        </h3>
        <button
          type="button"
          onClick={() => setModalDudaAbierto(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Preguntar en foro
        </button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-[#9E1FFF]" />
        </div>
      ) : error ? (
        <p className="py-4 text-center text-sm text-neutral-500">{error}</p>
      ) : dudas.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">
          No hay preguntas aún. Sé el primero en preguntar.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {dudas.map((duda) => (
            <DudaCard
              key={duda.id_dudas}
              duda={duda}
              currentUserId={currentUserId}
              puedeMarcar={puedeMarcar}
              onResponder={setDudaSeleccionada}
              onMarcarRespuesta={handleMarcarRespuesta}
              onSeek={onSeek}
            />
          ))}
        </div>
      )}

      <CrearDudaModal
        isOpen={modalDudaAbierto}
        onClose={() => setModalDudaAbierto(false)}
        onSubmit={handleCrearDuda}
        segundoActual={segundoActual}
      />

      <CrearRespuestaModal
        isOpen={dudaSeleccionada !== null}
        onClose={() => setDudaSeleccionada(null)}
        onSubmit={handleCrearRespuesta}
        dudaTexto={dudaSeleccionada?.duda ?? ''}
      />
    </div>
  )
}
