import React, { useState, useEffect, useMemo } from 'react'
import { inscripcionApi } from '../../api/inscripcion'
import { authApi } from '../../api/auth'
import type { InscripcionItem } from '../../types/admin.types'
import type { Curso, Periodo } from '../../types/inscripcion.types'

const ESTADOS_MATRICULA_MAP: Record<number, string> = {
  1: 'INSCRITO',
  2: 'APROBADO',
  3: 'REPROBADO',
  4: 'RETIRADO',
  5: 'CANCELADO',
}

const ESTADOS_INV_MAP: Record<string, number> = {
  INSCRITO: 1,
  APROBADO: 2,
  REPROBADO: 3,
  RETIRADO: 4,
  CANCELADO: 5,
}

interface EstudianteOption {
  id_usuario: number
  nombre: string
  apellido: string
  carrera: string
  correo: string
}

export const InscripcionesManager: React.FC = () => {
  const [inscripciones, setInscripciones] = useState<InscripcionItem[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [estudiantes, setEstudiantes] = useState<EstudianteOption[]>([])
  const [estadosMatricula, setEstadosMatricula] = useState<string[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New Enrollment Modal
  const [showInscribirModal, setShowInscribirModal] = useState(false)
  const [newUsuarioId, setNewUsuarioId] = useState<number>(0)
  const [newCursoId, setNewCursoId] = useState<number>(0)
  const [newPeriodoId, setNewPeriodoId] = useState<number>(0)
  const [newAnio, setNewAnio] = useState<number>(0)
  const [newSemestre, setNewSemestre] = useState<number>(0)

  // Edit Status Modal
  const [showEditStatusModal, setShowEditStatusModal] = useState(false)
  const [selectedInscripcion, setSelectedInscripcion] = useState<InscripcionItem | null>(null)
  const [nuevoEstadoStr, setNuevoEstadoStr] = useState<string>('INSCRITO')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina])

  const aniosDisponibles = useMemo(
    () => Array.from(new Set(periodos.map((p) => p.anio))).sort((a, b) => b - a),
    [periodos]
  )

  const semestresDisponibles = useMemo(
    () =>
      periodos
        .filter((p) => p.anio === newAnio)
        .map((p) => p.num_semestre)
        .sort((a, b) => a - b),
    [periodos, newAnio]
  )

  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const [resCursos, resPeriodos, resEstados, resInscripciones, resUsuarios, resPerfiles] =
        await Promise.all([
          inscripcionApi.consultarCursos(),
          inscripcionApi.consultarPeriodos(),
          inscripcionApi.consultarEstadosMatricula(),
          inscripcionApi.consultarTodasInscripciones({ pagina }),
          authApi.consultarUsuarios(),
          inscripcionApi.consultarPerfilesEstudiante(),
        ])

      if (resCursos.exito && resCursos.cursos) {
        setCursos(resCursos.cursos)
        if (resCursos.cursos.length > 0) setNewCursoId(resCursos.cursos[0].id_curso)
      }

      if (resPeriodos.exito && resPeriodos.periodos && resPeriodos.periodos.length > 0) {
        setPeriodos(resPeriodos.periodos)
        const primero = resPeriodos.periodos[0]
        setNewAnio(primero.anio)
        setNewSemestre(primero.num_semestre)
        setNewPeriodoId(primero.id_periodo)
      }

      if (resEstados.exito && resEstados.estados && resEstados.estados.length > 0) {
        setEstadosMatricula(
          resEstados.estados.map((e) =>
            (e.codigo || e.nombre || ESTADOS_MATRICULA_MAP[e.id_estado]).toUpperCase()
          )
        )
      } else {
        setEstadosMatricula(Object.values(ESTADOS_MATRICULA_MAP))
      }

      const usuarios = resUsuarios.exito ? resUsuarios.usuarios ?? [] : []
      const perfiles = resPerfiles.exito ? resPerfiles.perfiles ?? [] : []
      const perfilPorUsuario = new Map<number, { carrera: string }>()
      perfiles.forEach((p) => perfilPorUsuario.set(p.id_usuario, { carrera: p.carrera }))

      const opciones: EstudianteOption[] = usuarios.map((u) => ({
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        apellido: u.apellido,
        carrera: perfilPorUsuario.get(u.id_usuario)?.carrera ?? 'Sin carrera',
        correo: u.correo_institucional,
      }))
      setEstudiantes(opciones)

      const nombrePorUsuario = new Map<number, string>()
      usuarios.forEach((u) =>
        nombrePorUsuario.set(u.id_usuario, `${u.nombre} ${u.apellido}`.trim())
      )

      const registros = resInscripciones.exito ? resInscripciones.registros ?? [] : []
      setTotalPaginas(resInscripciones.total_paginas ?? 1)

      const items: InscripcionItem[] = registros.map((r) => ({
        id_inscripcion: r.id_inscripcion,
        id_usuario: r.id_usuario,
        usuario_nombre: nombrePorUsuario.get(r.id_usuario),
        id_curso: r.id_curso,
        curso_nombre: r.curso,
        codigo_curso: r.codigo_curso,
        anio: r.anio,
        semestre: String(r.semestre),
        estado: (r.codigo_estado || r.estado_matricula || '').toUpperCase(),
        fecha_inscripcion: r.fecha_inscripcion,
      }))

      setInscripciones(items)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al cargar datos de inscripciones.' })
    } finally {
      setLoading(false)
    }
  }

  const handleAnioChange = (anio: number) => {
    setNewAnio(anio)
    const semestres = periodos
      .filter((p) => p.anio === anio)
      .map((p) => p.num_semestre)
      .sort((a, b) => a - b)
    const semestre = semestres[0] ?? 0
    setNewSemestre(semestre)
    const periodo = periodos.find((p) => p.anio === anio && p.num_semestre === semestre)
    setNewPeriodoId(periodo?.id_periodo ?? 0)
  }

  const handleSemestreChange = (semestre: number) => {
    setNewSemestre(semestre)
    const periodo = periodos.find((p) => p.anio === newAnio && p.num_semestre === semestre)
    setNewPeriodoId(periodo?.id_periodo ?? 0)
  }

  const handleCreateInscripcion = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await inscripcionApi.inscribirEstudiante({
        id_usuario: Number(newUsuarioId),
        id_curso: Number(newCursoId),
        id_periodo: Number(newPeriodoId),
        id_estado_matricula: 1,
        tipo_inscripcion: 'ORDINARIA',
      })

      if (res.exito) {
        setMessage({ type: 'success', text: 'Estudiante inscrito exitosamente al curso.' })
        setShowInscribirModal(false)
        loadData()
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo realizar la inscripción.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al procesar inscripción.',
      })
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedInscripcion) return
    setMessage(null)

    try {
      const estadoId = ESTADOS_INV_MAP[nuevoEstadoStr] || 1
      const res = await inscripcionApi.actualizarEstadoMatricula({
        id_inscripcion: selectedInscripcion.id_inscripcion,
        nuevo_estado: estadoId,
      })

      if (res.exito) {
        setMessage({
          type: 'success',
          text: `Estado de matrícula actualizado a "${nuevoEstadoStr}".`,
        })
        setInscripciones((prev) =>
          prev.map((item) =>
            item.id_inscripcion === selectedInscripcion.id_inscripcion
              ? { ...item, estado: nuevoEstadoStr }
              : item
          )
        )
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo actualizar el estado.' })
      }
      setShowEditStatusModal(false)
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al actualizar estado de matrícula.',
      })
    }
  }

  const colorEstado = (estado: string) => {
    switch (estado) {
      case 'INSCRITO':
        return 'bg-emerald-100 text-emerald-800'
      case 'APROBADO':
        return 'bg-blue-100 text-blue-800'
      case 'REPROBADO':
        return 'bg-rose-100 text-rose-800'
      case 'RETIRADO':
        return 'bg-amber-100 text-amber-800'
      case 'CANCELADO':
        return 'bg-neutral-200 text-neutral-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Gestión de Inscripciones y Matrículas</h2>
          <p className="text-xs text-neutral-500">
            Consulta inscripciones, edita estados de matrícula o inscribe estudiantes a cursos.
          </p>
        </div>

        <button
          onClick={() => setShowInscribirModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-95"
        >
          + Inscribir Estudiante a Curso
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Enrollments Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Cargando inscripciones...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">ID Inscripción</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Año / Semestre</th>
                <th className="px-4 py-3">Estado Matrícula</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {inscripciones.map((ins) => (
                <tr key={ins.id_inscripcion} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-neutral-500">#{ins.id_inscripcion}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">
                      {ins.usuario_nombre || `Usuario #${ins.id_usuario}`}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">ID: {ins.id_usuario}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{ins.curso_nombre}</div>
                    {ins.codigo_curso && (
                      <div className="text-[10px] text-neutral-500 font-mono">Código: {ins.codigo_curso}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {ins.anio} - Semestre {ins.semestre}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${colorEstado(
                        ins.estado
                      )}`}
                    >
                      {ins.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedInscripcion(ins)
                        setNuevoEstadoStr(ins.estado)
                        setShowEditStatusModal(true)
                      }}
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      Editar Estado
                    </button>
                  </td>
                </tr>
              ))}

              {inscripciones.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                    No existen inscripciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-neutral-500">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Inscribir Estudiante */}
      {showInscribirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">Inscribir Estudiante a Curso</h3>

            <form onSubmit={handleCreateInscripcion} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Estudiante</label>
                <select
                  required
                  value={newUsuarioId}
                  onChange={(e) => setNewUsuarioId(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                >
                  <option value={0} disabled>
                    Selecciona un estudiante...
                  </option>
                  {estudiantes.map((est) => (
                    <option key={est.id_usuario} value={est.id_usuario}>
                      {est.nombre} {est.apellido} — {est.carrera}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Año</label>
                  <select
                    required
                    value={newAnio}
                    onChange={(e) => handleAnioChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                  >
                    <option value={0} disabled>
                      Selecciona año...
                    </option>
                    {aniosDisponibles.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Semestre</label>
                  <select
                    required
                    value={newSemestre}
                    onChange={(e) => handleSemestreChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                  >
                    <option value={0} disabled>
                      Selecciona semestre...
                    </option>
                    {semestresDisponibles.map((sem) => (
                      <option key={sem} value={sem}>
                        Semestre {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Curso Destino</label>
                <select
                  required
                  value={newCursoId}
                  onChange={(e) => setNewCursoId(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                >
                  <option value={0} disabled>
                    Selecciona un curso...
                  </option>
                  {cursos.map((c) => (
                    <option key={c.id_curso} value={c.id_curso}>
                      [{c.codigo}] {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInscribirModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                >
                  Confirmar Inscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Estado Matrícula */}
      {showEditStatusModal && selectedInscripcion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Editar Estado de Matrícula</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Inscripción <strong className="text-neutral-800">#{selectedInscripcion.id_inscripcion}</strong> - Curso:{' '}
              {selectedInscripcion.curso_nombre}
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <label className="font-semibold text-neutral-700">Seleccionar Nuevo Estado:</label>
              <select
                value={nuevoEstadoStr}
                onChange={(e) => setNuevoEstadoStr(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
              >
                {estadosMatricula.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditStatusModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                >
                  Actualizar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
