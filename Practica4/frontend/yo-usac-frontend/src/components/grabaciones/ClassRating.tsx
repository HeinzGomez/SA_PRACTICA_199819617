import React, { useEffect, useState } from 'react'
import { analiticaApi } from '../../api/anal'

interface ClassRatingProps {
  idClase: number
}

const CANTIDAD_ESTRELLAS = 5

const ETIQUETAS_CALIFICACION: Record<number, string> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Regular',
  4: 'Buena',
  5: 'Excelente',
}

export const ClassRating: React.FC<ClassRatingProps> = ({ idClase }) => {
  const [valoracion, setValoracion] = useState<number>(0)
  const [hover, setHover] = useState<number>(0)
  const [enviando, setEnviando] = useState<boolean>(false)
  const [cargandoEstado, setCargandoEstado] = useState<boolean>(true)
  const [yaCalifico, setYaCalifico] = useState<boolean>(false)
  const [puntuacionPrevia, setPuntuacionPrevia] = useState<number>(0)
  const [promedio, setPromedio] = useState<number | null>(null)
  const [totalCalificaciones, setTotalCalificaciones] = useState<number>(0)

  useEffect(() => {
    let cancelado = false
    analiticaApi
      .consultarCalificacionUsuario(idClase)
      .then((response) => {
        if (cancelado) return
        if (typeof response.ya_califico === 'boolean') {
          setYaCalifico(response.ya_califico)
          setPuntuacionPrevia(response.puntuacion ?? 0)
          if (typeof response.promedio_calificacion === 'number') {
            setPromedio(response.promedio_calificacion)
          }
          setTotalCalificaciones(response.total_calificaciones ?? 0)
          if (response.ya_califico && (response.puntuacion ?? 0) > 0) {
            setValoracion(response.puntuacion ?? 0)
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          console.warn('No se pudo consultar la calificación previa de la clase:', err)
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoEstado(false)
        }
      })
    return () => {
      cancelado = true
    }
  }, [idClase])

  const puedeEnviar = valoracion > 0 && !enviando && !yaCalifico

  const handleEnviar = async () => {
    if (valoracion < 1 || enviando || yaCalifico) return
    setEnviando(true)
    try {
      const response = await analiticaApi.calificarClase({
        id_clase: idClase,
        puntuacion: valoracion,
      })
      setYaCalifico(true)
      setPuntuacionPrevia(valoracion)
      if (typeof response.promedio_calificacion === 'number') {
        setPromedio(response.promedio_calificacion)
      }
    } catch (err) {
      console.warn('No se pudo calificar la clase:', err)
    } finally {
      setEnviando(false)
    }
  }

  const estrellasMostradas = yaCalifico ? puntuacionPrevia : hover || valoracion

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Califica esta clase
        </h3>
        <p className="text-sm text-neutral-600">
          Tu opinión ayuda a otros estudiantes a elegir mejor.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" aria-label={`Calificación: ${estrellasMostradas} de 5`}>
          {Array.from({ length: CANTIDAD_ESTRELLAS }, (_, idx) => {
            const estrella = idx + 1
            const activa = estrella <= estrellasMostradas
            return (
              <button
                key={estrella}
                type="button"
                aria-label={`${estrella} estrella${estrella > 1 ? 's' : ''}`}
                disabled={yaCalifico}
                className="text-2xl leading-none transition focus:outline-none disabled:cursor-default"
                onMouseEnter={() => !yaCalifico && setHover(estrella)}
                onMouseLeave={() => setHover(0)}
                onClick={() => {
                  if (!yaCalifico) setValoracion(valoracion === estrella ? 0 : estrella)
                }}
              >
                {activa ? (
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#F5A623" aria-hidden="true">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#D4D4D4"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {yaCalifico ? (
          <span className="text-sm font-semibold text-emerald-600">
            Ya calificaste esta clase con {puntuacionPrevia} de {CANTIDAD_ESTRELLAS}(
            {ETIQUETAS_CALIFICACION[puntuacionPrevia]})
          </span>
        ) : (
          valoracion > 0 && (
            <span className="text-sm font-semibold text-[#7a00c9]">
              {ETIQUETAS_CALIFICACION[valoracion]} ({valoracion}/{CANTIDAD_ESTRELLAS})
            </span>
          )
        )}
      </div>

      <div className="flex items-center gap-3">
        {yaCalifico ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Calificación registrada
          </span>
        ) : (
          <button
            type="button"
            disabled={!puedeEnviar}
            onClick={handleEnviar}
            className="rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enviando ? 'Calificando...' : 'Enviar calificación'}
          </button>
        )}

        {(promedio !== null || cargandoEstado) && (
          <span className="flex items-center gap-1 text-sm font-medium text-neutral-600">
            {cargandoEstado ? (
              'Cargando promedio...'
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#F5A623" aria-hidden="true">
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                Promedio: {promedio !== null ? promedio.toFixed(2) : '—'} ({totalCalificaciones}{' '}
                {totalCalificaciones === 1 ? 'voto' : 'votos'})
              </>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

export default ClassRating