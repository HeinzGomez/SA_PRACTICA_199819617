import React, { useState, useEffect } from 'react'
import { inscripcionApi } from '../../api/inscripcion'
import { grabacionesApi } from '../../api/grabaciones'
import { catalogoSincronizadoService } from '../../services/catalogoSincronizado.service'
import type {
  AreaItem,
  CursoItem,
  CarreraItem,
  PensumItem,
  PeriodoItem,
  UnidadItem,
  TemaItem,
} from '../../types/admin.types'

type SubTab = 'areas' | 'cursos' | 'pensums' | 'periodos' | 'carreras' | 'unidades' | 'temas'

export const AcademicCatalogManager: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('areas')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Data states
  const [areas, setAreas] = useState<AreaItem[]>([])
  const [cursos, setCursos] = useState<CursoItem[]>([])
  const [pensums, setPensums] = useState<PensumItem[]>([])
  const [periodos, setPeriodos] = useState<PeriodoItem[]>([])
  const [carreras, setCarreras] = useState<CarreraItem[]>([])
  const [unidades, setUnidades] = useState<UnidadItem[]>([])
  const [temas, setTemas] = useState<TemaItem[]>([])

  // Modal / Form states
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  // Form Fields
  const [areaNombre, setAreaNombre] = useState('')
  const [areaCodigo, setAreaCodigo] = useState('')
  const [areaDesc, setAreaDesc] = useState('')

  const [cursoCodigo, setCursoCodigo] = useState('')
  const [cursoNombre, setCursoNombre] = useState('')
  const [cursoDesc, setCursoDesc] = useState('')
  const [cursoAreaId, setCursoAreaId] = useState<number>(0)

  const [carreraNombre, setCarreraNombre] = useState('')
  const [carreraFacultad, setCarreraFacultad] = useState('Ingeniería')
  const [carreraPensumId] = useState<number>(1)

  const [pensumNombre, setPensumNombre] = useState('')
  const [pensumDesc, setPensumDesc] = useState('')

  const [periodoAnio, setPeriodoAnio] = useState<number>(new Date().getFullYear())
  const [periodoSemestre, setPeriodoSemestre] = useState<number>(1)

  const [unidadNombre, setUnidadNombre] = useState('')
  const [unidadDesc, setUnidadDesc] = useState('')

  const [temaNombre, setTemaNombre] = useState('')
  const [temaUnidadId, setTemaUnidadId] = useState<number>(0)

  useEffect(() => {
    loadData()
  }, [subTab])

  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      if (subTab === 'areas') {
        const res = await inscripcionApi.consultarAreas()
        if (res.exito && res.areas) {
          setAreas(res.areas as any)
        }
      } else if (subTab === 'cursos') {
        const [resCursos, resAreas] = await Promise.all([
          inscripcionApi.consultarCursos(),
          inscripcionApi.consultarAreas(),
        ])
        if (resAreas.exito && resAreas.areas) setAreas(resAreas.areas as any)
        if (resCursos.exito && resCursos.cursos) setCursos(resCursos.cursos as any)
      } else if (subTab === 'carreras') {
        const res = await inscripcionApi.consultarCarreras()
        if (res.exito && res.carreras) setCarreras(res.carreras as any)
      } else if (subTab === 'pensums') {
        const res = await inscripcionApi.consultarPensums()
        if (res.exito && res.pensums) setPensums(res.pensums as any)
      } else if (subTab === 'periodos') {
        const res = await inscripcionApi.consultarPeriodos()
        if (res.exito && res.periodos) setPeriodos(res.periodos as any)
      } else if (subTab === 'unidades') {
        const res = await grabacionesApi.consultarUnidades()
        if (res.exito && res.unidades) setUnidades(res.unidades as any)
      } else if (subTab === 'temas') {
        const [resTemas, resUnidades] = await Promise.all([
          grabacionesApi.consultarTemas({ id_unidad: 0 }),
          grabacionesApi.consultarUnidades(),
        ])
        if (resUnidades.exito && resUnidades.unidades) setUnidades(resUnidades.unidades as any)
        if (resTemas.exito && resTemas.temas) setTemas(resTemas.temas as any)
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al cargar los datos del catálogo.' })
    } finally {
      setLoading(false)
    }
  }

  const openModal = (item: any = null) => {
    setEditingItem(item)
    if (subTab === 'areas') {
      setAreaNombre(item ? item.nombre : '')
      setAreaCodigo(item ? item.codigo || '' : '')
      setAreaDesc(item ? item.descripcion || '' : '')
    } else if (subTab === 'cursos') {
      setCursoCodigo(item ? item.codigo || '' : '')
      setCursoNombre(item ? item.nombre : '')
      setCursoDesc(item ? item.descripcion || '' : '')
      setCursoAreaId(item ? item.id_area || 0 : areas[0]?.id_area || 0)
    } else if (subTab === 'carreras') {
      setCarreraNombre(item ? item.nombre : '')
      setCarreraFacultad(item ? item.facultad || 'Ingeniería' : 'Ingeniería')
    } else if (subTab === 'pensums') {
      setPensumNombre(item ? item.nombre : '')
      setPensumDesc(item ? item.descripcion || '' : '')
    } else if (subTab === 'periodos') {
      setPeriodoAnio(item ? item.anio : new Date().getFullYear())
      setPeriodoSemestre(item ? item.num_semestre : 1)
    } else if (subTab === 'unidades') {
      setUnidadNombre(item ? item.nombre : '')
      setUnidadDesc(item ? item.descripcion || '' : '')
    } else if (subTab === 'temas') {
      setTemaNombre(item ? item.nombre : '')
      setTemaUnidadId(item ? item.id_unidad || 0 : unidades[0]?.id_unidad || 0)
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      if (subTab === 'areas') {
        if (editingItem) {
          const res = await inscripcionApi.editarArea({
            id_area: editingItem.id_area,
            codigo: areaCodigo || `AREA_${editingItem.id_area}`,
            nombre: areaNombre,
            descripcion: areaDesc,
          })
          if (res.exito) {
            setMessage({ type: 'success', text: 'Área actualizada exitosamente.' })
          }
        } else {
          const res = await inscripcionApi.crearArea({
            codigo: areaCodigo || `AREA_${Date.now()}`,
            nombre: areaNombre,
            descripcion: areaDesc,
          })
          if (res.exito) {
            setMessage({ type: 'success', text: 'Área creada exitosamente.' })
          }
        }
      } else if (subTab === 'cursos') {
        if (editingItem) {
          const res = await inscripcionApi.editarCurso({
            id_curso: editingItem.id_curso,
            codigo: cursoCodigo || `CURSO_${editingItem.id_curso}`,
            nombre: cursoNombre,
            descripcion: cursoDesc,
            id_area: cursoAreaId,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Curso editado exitosamente.' })
        } else {
          const res = await inscripcionApi.crearCurso({
            codigo: cursoCodigo,
            nombre: cursoNombre,
            descripcion: cursoDesc,
            id_area: cursoAreaId,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Curso guardado exitosamente.' })
        }
      } else if (subTab === 'carreras') {
        if (editingItem) {
          const res = await inscripcionApi.editarCarrera({
            id_carrera: editingItem.id_carrera,
            facultad: carreraFacultad,
            nombre: carreraNombre,
            descripcion: 'Carrera de Grado Académico',
            id_pensum: carreraPensumId,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Carrera editada exitosamente.' })
        } else {
          const res = await inscripcionApi.crearCarrera({
            facultad: carreraFacultad,
            nombre: carreraNombre,
            descripcion: 'Carrera de Grado Académico',
            id_pensum: carreraPensumId,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Carrera guardada exitosamente.' })
        }
      } else if (subTab === 'pensums') {
        if (editingItem) {
          const res = await inscripcionApi.editarPensum({
            id_pensum: editingItem.id_pensum,
            nombre: pensumNombre,
            descripcion: pensumDesc,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Pensum editado exitosamente.' })
        } else {
          const res = await inscripcionApi.crearPensum({
            nombre: pensumNombre,
            descripcion: pensumDesc,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Pensum guardado exitosamente.' })
        }
      } else if (subTab === 'periodos') {
        if (editingItem) {
          const res = await inscripcionApi.editarPeriodo({
            id_periodo: editingItem.id_periodo,
            anio: periodoAnio,
            num_semestre: periodoSemestre,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Período editado exitosamente.' })
        } else {
          const res = await inscripcionApi.crearPeriodo({
            anio: periodoAnio,
            num_semestre: periodoSemestre,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Período guardado exitosamente.' })
        }
      } else if (subTab === 'unidades') {
        if (editingItem) {
          const res = await catalogoSincronizadoService.editarUnidad(editingItem.id_unidad, {
            nombre: unidadNombre,
            descripcion: unidadDesc,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Unidad editada exitosamente.' })
          else {
            setMessage({ type: 'error', text: res.mensaje || 'No se pudo editar la unidad.' })
            return
          }
        } else {
          const res = await catalogoSincronizadoService.crearUnidad({
            nombre: unidadNombre,
            descripcion: unidadDesc,
          })
          if (res.exito) setMessage({ type: 'success', text: 'Unidad creada exitosamente.' })
          else {
            setMessage({ type: 'error', text: res.mensaje || 'No se pudo crear la unidad.' })
            return
          }
        }
      } else if (subTab === 'temas') {
        if (editingItem) {
          const res = await catalogoSincronizadoService.editarTema(
            editingItem.id_tema,
            temaUnidadId,
            temaNombre,
            'Tema académico'
          )
          if (res.exito) setMessage({ type: 'success', text: 'Tema editado exitosamente.' })
          else {
            setMessage({ type: 'error', text: res.mensaje || 'No se pudo editar el tema.' })
            return
          }
        } else {
          const res = await catalogoSincronizadoService.crearTema(
            temaUnidadId,
            temaNombre,
            'Tema académico'
          )
          if (res.exito) setMessage({ type: 'success', text: 'Tema guardado exitosamente.' })
          else {
            setMessage({ type: 'error', text: res.mensaje || 'No se pudo crear el tema.' })
            return
          }
        }
      }

      setShowModal(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.response?.data?.mensaje || 'Error al guardar elemento.' })
    }
  }

  const handleDelete = async (item: any) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.nombre || item.codigo || 'este registro'}"?`)) {
      return
    }
    setMessage(null)
    try {
      if (subTab === 'areas') {
        const res = await inscripcionApi.eliminarArea(item.id_area)
        if (res.exito) setMessage({ type: 'success', text: 'Área eliminada correctamente.' })
        loadData()
      } else if (subTab === 'cursos') {
        const res = await inscripcionApi.eliminarCurso(item.id_curso)
        if (res.exito) setMessage({ type: 'success', text: 'Curso eliminado correctamente.' })
        loadData()
      } else if (subTab === 'carreras') {
        const res = await inscripcionApi.eliminarCarrera(item.id_carrera)
        if (res.exito) setMessage({ type: 'success', text: 'Carrera eliminada correctamente.' })
        loadData()
      } else if (subTab === 'pensums') {
        const res = await inscripcionApi.eliminarPensum(item.id_pensum)
        if (res.exito) setMessage({ type: 'success', text: 'Pensum eliminado correctamente.' })
        loadData()
      } else if (subTab === 'periodos') {
        const res = await inscripcionApi.eliminarPeriodo(item.id_periodo)
        if (res.exito) setMessage({ type: 'success', text: 'Período eliminado correctamente.' })
        loadData()
      } else if (subTab === 'unidades') {
        const res = await catalogoSincronizadoService.eliminarUnidad(item.id_unidad)
        if (res.exito) setMessage({ type: 'success', text: 'Unidad eliminada correctamente.' })
        else setMessage({ type: 'error', text: res.mensaje || 'No se pudo eliminar la unidad.' })
        loadData()
      } else if (subTab === 'temas') {
        const res = await catalogoSincronizadoService.eliminarTema(item.id_tema)
        if (res.exito) setMessage({ type: 'success', text: 'Tema eliminado correctamente.' })
        else setMessage({ type: 'error', text: res.mensaje || 'No se pudo eliminar el tema.' })
        loadData()
      } else {
        setMessage({ type: 'error', text: 'La eliminación de esta entidad requiere confirmación backend.' })
        loadData()
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'No se pudo eliminar el registro seleccionado.' })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Subtab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {[
          { key: 'areas', label: 'Áreas' },
          { key: 'cursos', label: 'Cursos' },
          { key: 'pensums', label: 'Pensums' },
          { key: 'periodos', label: 'Periodos' },
          { key: 'carreras', label: 'Carreras' },
          { key: 'unidades', label: 'Unidades' },
          { key: 'temas', label: 'Temas' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key as SubTab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              subTab === tab.key
                ? 'bg-[#9E1FFF] text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto">
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-1.5 text-xs font-semibold text-white shadow hover:opacity-95"
          >
            + Nuevo Registro
          </button>
        </div>
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

      {/* Table view */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Cargando registros...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre / Descripción</th>
                {subTab === 'areas' && <th className="px-4 py-3">Código</th>}
                {subTab === 'cursos' && <th className="px-4 py-3">Código</th>}
                {subTab === 'periodos' && <th className="px-4 py-3">Año / Semestre</th>}
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subTab === 'areas' &&
                areas.map((a) => (
                  <tr key={a.id_area} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{a.id_area}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{a.nombre}</div>
                      {a.descripcion && (
                        <div className="text-neutral-500 text-[11px]">{a.descripcion}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{a.codigo || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(a)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'cursos' &&
                cursos.map((c) => (
                  <tr key={c.id_curso} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{c.id_curso}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{c.nombre}</td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{c.codigo}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(c)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'carreras' &&
                carreras.map((car) => (
                  <tr key={car.id_carrera} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{car.id_carrera}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{car.nombre}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(car)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(car)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'pensums' &&
                pensums.map((p) => (
                  <tr key={p.id_pensum} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{p.id_pensum}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{p.nombre}</div>
                      {p.descripcion && (
                        <div className="text-neutral-500 text-[11px]">{p.descripcion}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(p)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'periodos' &&
                periodos.map((per) => (
                  <tr key={per.id_periodo} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{per.id_periodo}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {per.anio}-{per.num_semestre}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">
                      Año {per.anio} · Semestre {per.num_semestre}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(per)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(per)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'unidades' &&
                unidades.map((u) => (
                  <tr key={u.id_unidad} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{u.id_unidad}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{u.nombre}</div>
                      <div className="text-neutral-500 text-[11px]">{u.descripcion}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(u)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

              {subTab === 'temas' &&
                temas.map((t) => (
                  <tr key={t.id_tema} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-neutral-500">#{t.id_tema}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{t.nombre}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openModal(t)}
                        className="mr-2 text-indigo-600 hover:underline font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-rose-600 hover:underline font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingItem ? 'Editar' : 'Nuevo'} {subTab.slice(0, -1).toUpperCase()}
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4 text-xs">
              {subTab === 'areas' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre del Área</label>
                    <input
                      type="text"
                      required
                      value={areaNombre}
                      onChange={(e) => setAreaNombre(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Código</label>
                    <input
                      type="text"
                      value={areaCodigo}
                      onChange={(e) => setAreaCodigo(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Descripción del Área</label>
                    <textarea
                      value={areaDesc}
                      onChange={(e) => setAreaDesc(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {subTab === 'cursos' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Código Curso</label>
                    <input
                      type="text"
                      required
                      value={cursoCodigo}
                      onChange={(e) => setCursoCodigo(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre Curso</label>
                    <input
                      type="text"
                      required
                      value={cursoNombre}
                      onChange={(e) => setCursoNombre(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Área Perteneciente</label>
                    <select
                      value={cursoAreaId}
                      onChange={(e) => setCursoAreaId(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      {areas.map((a) => (
                        <option key={a.id_area} value={a.id_area}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {subTab === 'carreras' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Nombre de la Carrera</label>
                  <input
                    type="text"
                    required
                    value={carreraNombre}
                    onChange={(e) => setCarreraNombre(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                  />
                </div>
              )}

              {subTab === 'pensums' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre del Pensum</label>
                    <input
                      type="text"
                      required
                      value={pensumNombre}
                      onChange={(e) => setPensumNombre(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={pensumDesc}
                      onChange={(e) => setPensumDesc(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                </>
              )}

              {subTab === 'periodos' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Año</label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2100}
                      value={periodoAnio}
                      onChange={(e) => setPeriodoAnio(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Semestre</label>
                    <select
                      value={periodoSemestre}
                      onChange={(e) => setPeriodoSemestre(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      <option value={1}>Semestre 1</option>
                      <option value={2}>Semestre 2</option>
                    </select>
                  </div>
                </>
              )}

              {subTab === 'unidades' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre de la Unidad</label>
                    <input
                      type="text"
                      required
                      value={unidadNombre}
                      onChange={(e) => setUnidadNombre(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Descripción</label>
                    <textarea
                      value={unidadDesc}
                      onChange={(e) => setUnidadDesc(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                </>
              )}

              {subTab === 'temas' && (
                <>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Nombre del Tema</label>
                    <input
                      type="text"
                      required
                      value={temaNombre}
                      onChange={(e) => setTemaNombre(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Unidad Académica</label>
                    <select
                      value={temaUnidadId}
                      onChange={(e) => setTemaUnidadId(Number(e.target.value))}
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      {unidades.map((u) => (
                        <option key={u.id_unidad} value={u.id_unidad}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
