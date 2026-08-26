import React, { useState, useEffect } from 'react'
import { authApi } from '../../api/auth'
import { grabacionesApi } from '../../api/grabaciones'
import { inscripcionApi } from '../../api/inscripcion'
import { notificacionesApi } from '../../api/notificaciones'
import { clasesSincronizadasService } from '../../services/clasesSincronizadas.service'
import type { Usuario } from '../../types/auth.types'
import type { MaterialApoyo, Participante } from '../../types/grabaciones.types'
import type { ClaseGrabadaItem, CursoItem, TemaItem, AreaItem, PeriodoItem } from '../../types/admin.types'

const ROLES_MAP: Record<number, string> = {
  1: 'ESTUDIANTE',
  2: 'DOCENTE',
  3: 'AUXILIAR',
  4: 'ADMINISTRADOR',
}

export const ClasesGrabadasManager: React.FC = () => {
  const [clases, setClases] = useState<ClaseGrabadaItem[]>([])
  const [cursos, setCursos] = useState<CursoItem[]>([])
  const [temas, setTemas] = useState<TemaItem[]>([])
  const [areas, setAreas] = useState<AreaItem[]>([])
  const [periodos, setPeriodos] = useState<PeriodoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  // Modal Crear / Editar Clase
  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClaseGrabadaItem | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [idCurso, setIdCurso] = useState<number>(0)
  const [idArea, setIdArea] = useState<number>(0)
  const [idPeriodo, setIdPeriodo] = useState<number>(0)
  const [anioClase, setAnioClase] = useState<number>(new Date().getFullYear())
  const [numSemestreClase, setNumSemestreClase] = useState<number>(1)
  const [fechaImpartida, setFechaImpartida] = useState<string>(new Date().toISOString().split('T')[0])
  const [horaImpartida, setHoraImpartida] = useState<string>('00:00')
  const [duracionMin, setDuracionMin] = useState<number>(60)
  const [urlVideo, setUrlVideo] = useState('')

  // Modal Asignaciones (Docente, Auxiliar, Tema, Material)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClaseGrabadaItem | null>(null)
  const [assignTab, setAssignTab] = useState<'docente' | 'auxiliar' | 'tema' | 'material'>('docente')
  const [participantesClase, setParticipantesClase] = useState<Participante[]>([])
  const [temasClase, setTemasClase] = useState<TemaItem[]>([])
  const [materialesClase, setMaterialesClase] = useState<MaterialApoyo[]>([])
  const [usuariosPlataforma, setUsuariosPlataforma] = useState<Usuario[]>([])
  const [rolesUsuarios, setRolesUsuarios] = useState<Record<number, string>>({})

  const [idDocenteAsignar, setIdDocenteAsignar] = useState<number>(0)
  const [idAuxiliarAsignar, setIdAuxiliarAsignar] = useState<number>(0)
  const [idTemaAsignar, setIdTemaAsignar] = useState<number>(0)
  const [materialNombre, setMaterialNombre] = useState('')
  const [materialUrl, setMaterialUrl] = useState('')

  useEffect(() => {
    loadData()
  }, [pagina])

  const loadData = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const [resClases, resCursos, resTemas, resAreas, resPeriodos] = await Promise.all([
        grabacionesApi.consultarCatalogoClases(pagina),
        inscripcionApi.consultarCursos(),
        grabacionesApi.consultarTemas({ id_unidad: 0 }),
        inscripcionApi.consultarAreas(),
        inscripcionApi.consultarPeriodos(),
      ])

      if (resAreas.exito && resAreas.areas) {
        setAreas(resAreas.areas as any)
        if (resAreas.areas.length > 0) setIdArea(resAreas.areas[0].id_area)
      }

      if (resCursos.exito && resCursos.cursos) {
        setCursos(resCursos.cursos as any)
        const areaId = resAreas.areas ? resAreas.areas[0]?.id_area : undefined
        const primerCurso =
          resCursos.cursos.find((c: any) => c.id_area === areaId) || resCursos.cursos[0]
        if (primerCurso) setIdCurso(primerCurso.id_curso)
      }

      if (resTemas.exito && resTemas.temas) {
        setTemas(resTemas.temas as any)
        if (resTemas.temas.length > 0) setIdTemaAsignar(resTemas.temas[0].id_tema)
      }

      if (resAreas.exito && resAreas.areas) {
        setAreas(resAreas.areas as any)
        if (resAreas.areas.length > 0) setIdArea(resAreas.areas[0].id_area)
      }

      if (resPeriodos.exito && resPeriodos.periodos) {
        setPeriodos(resPeriodos.periodos as any)
        if (resPeriodos.periodos.length > 0) {
          setIdPeriodo(resPeriodos.periodos[0].id_periodo)
          setAnioClase(resPeriodos.periodos[0].anio)
          setNumSemestreClase(resPeriodos.periodos[0].num_semestre)
        }
      }

      if (resClases.exito && resClases.registros) {
        setTotalPaginas(resClases.total_paginas ?? 1)
        setClases(
          resClases.registros.map((item: any) => ({
            id_clase: item.id_clase,
            titulo: item.titulo || item.nombre_clase || `Clase #${item.id_clase}`,
            descripcion: item.descripcion || '',
            id_curso: item.id_curso || 1,
            curso_nombre: item.curso || 'Curso Académico',
            id_area: item.id_area,
            id_periodo: item.id_periodo,
            fecha_impartida: item.fecha_impartida || item.created_at,
            duracion_min: item.duracion_min,
            url_video: item.url_video || item.enlace_video,
            fecha_publicacion: item.fecha_impartida || item.created_at,
            anio: item.anio,
            num_semestre: item.num_semestre,
          }))
        )
      } else {
        setClases([
          {
            id_clase: 1,
            titulo: 'Clase Base de Datos 2: Unidad 1 ACID',
            descripcion: 'Propiedades de transacciones ACID en PostgresSQL.',
            id_curso: 1,
            curso_nombre: 'Base de Datos 2',
            url_video: 'https://youtube.com/watch?v=sample1',
            fecha_publicacion: '2026-08-10',
          },
          {
            id_clase: 2,
            titulo: 'Clase Redes 2: Configuración BGP & OSPF',
            descripcion: 'Enrutamiento dinámico en redes distribuidas.',
            id_curso: 2,
            curso_nombre: 'Redes de Computadoras 2',
            url_video: 'https://youtube.com/watch?v=sample2',
            fecha_publicacion: '2026-08-11',
          },
        ])
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al consultar catálogo de clases.' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (clase: ClaseGrabadaItem | null = null) => {
    setEditingClass(clase)
    const cursosDeArea = (areaId: number) =>
      cursos.filter((c) => c.id_area === areaId)
    if (clase) {
      setTitulo(clase.titulo)
      setDescripcion(clase.descripcion || '')
      const areaId =
        clase.id_area ||
        cursos.find((c) => c.id_curso === clase.id_curso)?.id_area ||
        areas[0]?.id_area ||
        0
      setIdArea(areaId)
      const cursoId = cursosDeArea(areaId).some((c) => c.id_curso === clase.id_curso)
        ? clase.id_curso
        : cursosDeArea(areaId)[0]?.id_curso || 0
      setIdCurso(cursoId || 0)
      setIdPeriodo(clase.id_periodo ?? periodos[0]?.id_periodo ?? 0)
      setAnioClase(clase.anio ?? periodos[0]?.anio ?? new Date().getFullYear())
      setNumSemestreClase(clase.num_semestre ?? periodos[0]?.num_semestre ?? 1)
      setFechaImpartida((clase.fecha_impartida || clase.fecha_publicacion || new Date().toISOString().split('T')[0]).slice(0, 10))
      setHoraImpartida((clase.fecha_impartida || clase.fecha_publicacion || '').slice(11, 16) || '00:00')
      setDuracionMin(clase.duracion_min ?? 60)
      setUrlVideo(clase.url_video || '')
    } else {
      setTitulo('')
      setDescripcion('')
      const areaId = areas[0]?.id_area ?? 0
      setIdArea(areaId)
      setIdCurso(cursosDeArea(areaId)[0]?.id_curso ?? 0)
      setIdPeriodo(periodos[0]?.id_periodo ?? 0)
      setAnioClase(periodos[0]?.anio ?? new Date().getFullYear())
      setNumSemestreClase(periodos[0]?.num_semestre ?? 1)
      setFechaImpartida(new Date().toISOString().split('T')[0])
      setHoraImpartida('00:00')
      setDuracionMin(60)
      setUrlVideo('')
    }
    setShowClassModal(true)
  }

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const payload = {
        titulo,
        descripcion,
        id_curso: Number(idCurso),
        id_area: Number(idArea),
        id_periodo: Number(idPeriodo),
        fecha_impartida: `${fechaImpartida} ${horaImpartida}:00`,
        duracion_min: Number(duracionMin),
        url_video: urlVideo,
        anio: Number(anioClase),
        num_semestre: Number(numSemestreClase),
      }

      if (editingClass) {
        const res = await clasesSincronizadasService.editarClaseGrabada(editingClass.id_clase, payload)
        if (res.exito) {
          setMessage({ type: 'success', text: 'Clase grabada editada correctamente.' })
        } else {
          setMessage({ type: 'error', text: res.mensaje || 'No se pudo editar la clase grabada.' })
          return
        }
      } else {
        const res = await clasesSincronizadasService.crearClaseGrabada(payload)
        if (res.exito) {
          setMessage({ type: 'success', text: 'Nueva clase grabada añadida exitosamente.' })
          const nombreCurso = cursos.find((c) => c.id_curso === payload.id_curso)?.nombre
          const detalle = [
            `Clase: ${titulo}`,
            descripcion ? `Descripción: ${descripcion}` : null,
            nombreCurso ? `Curso: ${nombreCurso}` : null,
            payload.fecha_impartida ? `Fecha impartida: ${payload.fecha_impartida}` : null,
          ]
            .filter(Boolean)
            .join('\n')
          await enviarNotificacionContenidoNuevo(
            `Nueva clase grabada disponible: ${titulo}`,
            detalle
          )
        } else {
          setMessage({ type: 'error', text: res.mensaje || 'No se pudo crear la clase grabada.' })
          return
        }
      }

      setShowClassModal(false)
      loadData()
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al guardar clase grabada.',
      })
    }
  }

  const handleDeleteClass = async (idClase: number) => {
    if (!window.confirm(`¿Estás seguro de eliminar la clase grabada #${idClase}?`)) return
    setMessage(null)

    try {
      const res = await clasesSincronizadasService.eliminarClaseGrabada(idClase)
      if (res.exito) {
        setMessage({ type: 'success', text: 'Clase grabada eliminada del sistema.' })
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo eliminar la clase grabada.' })
      }
      loadData()
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al eliminar clase grabada.' })
    }
  }

  const cargarUsuariosConRoles = async () => {
    const resUsuarios = await authApi.consultarUsuarios()
    if (!resUsuarios.exito || !resUsuarios.usuarios) return
    setUsuariosPlataforma(resUsuarios.usuarios)

    const roles: Record<number, string> = {}
    await Promise.all(
      resUsuarios.usuarios.map(async (u) => {
        try {
          const resRoles = await inscripcionApi.consultarRolesUsuario(u.id_usuario)
          if (resRoles.exito && resRoles.roles && resRoles.roles.length > 0) {
            const nombreRol = resRoles.roles[0].rol || ROLES_MAP[resRoles.roles[0].id_rol]
            roles[u.id_usuario] = nombreRol ? nombreRol.toUpperCase() : ''
          }
        } catch (e) {
          // usuario sin rol consultable
        }
      })
    )
    setRolesUsuarios(roles)
  }

  const obtenerCorreosUsuarios = async (): Promise<string[]> => {
    try {
      const res = await authApi.consultarUsuarios()
      if (!res.exito || !res.usuarios) return []
      return res.usuarios
        .map((u) => u.correo_institucional)
        .filter((c): c is string => Boolean(c && c.trim()))
    } catch (err) {
      console.warn('No se pudieron obtener los usuarios para notificar:', err)
      return []
    }
  }

  const enviarNotificacionContenidoNuevo = async (
    titulo: string,
    descripcion: string
  ): Promise<void> => {
    const correos = await obtenerCorreosUsuarios()
    if (correos.length === 0) return
    try {
      const res = await notificacionesApi.enviarContenidoNuevo({
        correos,
        titulo_contenido: titulo,
        descripcion,
      })
      if (res.exito) {
        setMessage((prev) => {
          if (prev?.type === 'error') return prev
          return { type: 'success', text: `${prev?.text ?? ''} Correo de notificación enviado.` }
        })
      } else {
        console.warn('No se pudo notificar el contenido nuevo:', res.mensaje)
      }
    } catch (err) {
      console.warn('Error enviando notificación de contenido nuevo:', err)
    }
  }

  const cargarDetalleClase = async (idClase: number) => {
    const resDetalle = await grabacionesApi.obtenerDetalleClase(idClase)
    if (!resDetalle.exito || !resDetalle.detalle) return
    setTemasClase(
      (resDetalle.detalle.temas ?? []).map((t) => ({
        id_tema: t.id_tema,
        nombre: t.nombre,
        id_unidad: t.id_unidad,
        unidad_nombre: t.unidad,
      }))
    )
    setMaterialesClase(resDetalle.detalle.materiales ?? [])
    setParticipantesClase(resDetalle.detalle.participantes ?? [])
  }

  const handleOpenAssignModal = async (clase: ClaseGrabadaItem) => {
    setSelectedClass(clase)
    setAssignTab('docente')
    setParticipantesClase([])
    setTemasClase([])
    setMaterialesClase([])
    setIdDocenteAsignar(0)
    setIdAuxiliarAsignar(0)
    setIdTemaAsignar(temas[0]?.id_tema ?? 0)
    setMaterialNombre('')
    setMaterialUrl('')
    setShowAssignModal(true)
    setMessage(null)
    try {
      await Promise.all([cargarDetalleClase(clase.id_clase), cargarUsuariosConRoles()])
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al cargar las asignaciones de la clase.' })
    }
  }

  const docentesAsignados = participantesClase
    .filter((p) => p.tipo_participante === 'DOCENTE')
    .map((p) => usuariosPlataforma.find((u) => u.id_usuario === p.id_usuario))
    .filter((u): u is Usuario => Boolean(u))

  const auxiliaresAsignados = participantesClase
    .filter((p) => p.tipo_participante === 'AUXILIAR')
    .map((p) => usuariosPlataforma.find((u) => u.id_usuario === p.id_usuario))
    .filter((u): u is Usuario => Boolean(u))

  const docentesDisponibles = usuariosPlataforma.filter(
    (u) => rolesUsuarios[u.id_usuario] === 'DOCENTE' && !docentesAsignados.some((d) => d.id_usuario === u.id_usuario)
  )

  const auxiliaresDisponibles = usuariosPlataforma.filter(
    (u) => rolesUsuarios[u.id_usuario] === 'AUXILIAR' && !auxiliaresAsignados.some((a) => a.id_usuario === u.id_usuario)
  )

  const temasAsignados = temasClase
  const temasDisponibles = temas.filter(
    (t) => !temasClase.some((tc) => tc.id_tema === t.id_tema)
  )

  const handleAsignarDocente = async () => {
    if (!selectedClass || !idDocenteAsignar) return
    setMessage(null)
    try {
      const res = await grabacionesApi.asignarDocente(selectedClass.id_clase, Number(idDocenteAsignar))
      if (res.exito) {
        setMessage({ type: 'success', text: 'Docente asignado a la clase.' })
        setIdDocenteAsignar(0)
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo asignar el docente.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al asignar el docente.',
      })
    }
  }

  const handleDesasignarDocente = async (idUsuario: number) => {
    if (!selectedClass) return
    setMessage(null)
    try {
      const res = await grabacionesApi.desasignarDocente(selectedClass.id_clase, idUsuario)
      if (res.exito) {
        setMessage({ type: 'success', text: 'Docente desasignado de la clase.' })
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo desasignar el docente.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al desasignar el docente.',
      })
    }
  }

  const handleAsignarAuxiliar = async () => {
    if (!selectedClass || !idAuxiliarAsignar) return
    setMessage(null)
    try {
      const res = await grabacionesApi.asignarAuxiliar(selectedClass.id_clase, Number(idAuxiliarAsignar))
      if (res.exito) {
        setMessage({ type: 'success', text: 'Auxiliar asignado a la clase.' })
        setIdAuxiliarAsignar(0)
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo asignar el auxiliar.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al asignar el auxiliar.',
      })
    }
  }

  const handleDesasignarAuxiliar = async (idUsuario: number) => {
    if (!selectedClass) return
    setMessage(null)
    try {
      const res = await grabacionesApi.desasignarAuxiliar(selectedClass.id_clase, idUsuario)
      if (res.exito) {
        setMessage({ type: 'success', text: 'Auxiliar desasignado de la clase.' })
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo desasignar el auxiliar.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al desasignar el auxiliar.',
      })
    }
  }

  const handleAsignarTema = async () => {
    if (!selectedClass || !idTemaAsignar) return
    setMessage(null)
    try {
      const res = await clasesSincronizadasService.asignarTemaClaseGrabada(
        selectedClass.id_clase,
        Number(idTemaAsignar)
      )
      if (res.exito) {
        setMessage({ type: 'success', text: 'Tema asociado a la clase.' })
        setIdTemaAsignar(0)
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo asociar el tema.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al asociar el tema.',
      })
    }
  }

  const handleDesasignarTema = async (idTema: number) => {
    if (!selectedClass) return
    setMessage(null)
    try {
      const res = await clasesSincronizadasService.desasignarTemaClaseGrabada(
        selectedClass.id_clase,
        idTema
      )
      if (res.exito) {
        setMessage({ type: 'success', text: 'Tema desasociado de la clase.' })
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo desasociar el tema.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al desasociar el tema.',
      })
    }
  }

  const handleAsignarMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass || !materialNombre.trim() || !materialUrl.trim()) return
    setMessage(null)
    try {
      const res = await grabacionesApi.asignarMaterialApoyo(selectedClass.id_clase, {
        nombre: materialNombre.trim(),
        tipo: 'DOCUMENTO',
        url: materialUrl.trim(),
      })
      if (res.exito) {
        setMessage({ type: 'success', text: 'Material de apoyo añadido a la clase.' })
        setMaterialNombre('')
        setMaterialUrl('')
        await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo añadir el material.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al añadir material de apoyo.',
      })
    }
  }

  const handleEliminarMaterial = async (idMaterial: number) => {
    setMessage(null)
    try {
      const res = await grabacionesApi.desasignarMaterialApoyo(idMaterial)
      if (res.exito) {
        setMessage({ type: 'success', text: 'Material de apoyo eliminado.' })
        if (selectedClass) await cargarDetalleClase(selectedClass.id_clase)
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo eliminar el material.' })
      }
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error al eliminar material de apoyo.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Gestión de Clases Grabadas</h2>
          <p className="text-xs text-neutral-500">
            Consulta, edita, elimina o sube nuevas clases grabadas a la plataforma con materiales y temas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#9E1FFF] to-[#2E1FFF] px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-95"
          >
            + Añadir Nueva Clase Grabada
          </button>

          <label className="ml-2 flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setMessage(null)
                try {
                  const text = await file.text()
                  const lines = text.split(/\r?\n/).filter(Boolean)
                  if (lines.length <= 1) {
                    setMessage({ type: 'error', text: 'CSV vacío o sin filas de datos.' })
                    return
                  }
                  const headers = lines[0].split(',').map((h) => h.trim())
                  const items = lines.slice(1).map((line) => {
                    const cols = line.split(',')
                    const obj: any = {}
                    headers.forEach((h, i) => {
                      obj[h] = cols[i] ?? ''
                    })
                    return {
                      id_curso: Number(obj.id_curso || obj.idCurso || 1),
                      id_periodo: Number(obj.id_periodo || obj.idPeriodo || idPeriodo),
                      id_area: Number(obj.id_area || obj.idArea || idArea),
                      titulo: obj.titulo || obj.title || 'Sin título',
                      fecha_impartida:
                        obj.fecha_impartida || obj.fecha || `${anioClase}-01-01 09:00:00`,
                      duracion_min: Number(obj.duracion_min || obj.duracion || duracionMin),
                      descripcion: obj.descripcion || '',
                      url_video: obj.url_video || obj.url || '',
                      anio: Number(obj.anio || anioClase),
                      num_semestre: Number(obj.num_semestre || obj.semestre || numSemestreClase),
                    }
                  })

                  const data = await clasesSincronizadasService.cargaMasivaClases(items)
                  if (data && data.exito) {
                    setMessage({ type: 'success', text: 'Carga masiva procesada. Revisa resultados en consola.' })
                    console.log('Carga masiva resultados:', data)

                    const exitosasRaw = (data.resultados ?? [])
                      .filter((r) => r.exito)
                      .map((r) => items[r.index])
                      .filter(Boolean)
                    const exitosas =
                      exitosasRaw.length > 0 ? exitosasRaw : data.exito ? items : []

                    if (exitosas.length > 0) {
                      const resumen = exitosas
                        .map((c, i) => {
                          const nombreCurso = cursos.find((cc) => cc.id_curso === c.id_curso)?.nombre
                          return [
                            `${i + 1}. ${c.titulo}`,
                            c.descripcion ? `   Descripción: ${c.descripcion}` : null,
                            nombreCurso ? `   Curso: ${nombreCurso}` : null,
                            c.fecha_impartida ? `   Fecha impartida: ${c.fecha_impartida}` : null,
                          ]
                            .filter(Boolean)
                            .join('\n')
                        })
                        .join('\n')

                      await enviarNotificacionContenidoNuevo(
                        exitosas.length === 1
                          ? '1 nueva clase grabada disponible'
                          : `${exitosas.length} nuevas clases grabadas disponibles`,
                        resumen
                      )
                    }

                    loadData()
                  } else {
                    setMessage({ type: 'error', text: data?.mensaje || 'Error en carga masiva.' })
                    console.error('Carga masiva error:', data)
                  }
                } catch (err: any) {
                  console.error(err)
                  setMessage({ type: 'error', text: 'Error procesando el archivo CSV.' })
                }
              }}
            />
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
              Subir CSV
            </span>
          </label>
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

      {/* Clases Grid / Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Cargando clases grabadas...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Título / Descripción</th>
                <th className="px-4 py-3">Curso</th>
                <th className="px-4 py-3">Enlace Video</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clases.map((c) => (
                <tr key={c.id_clase} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-neutral-500">#{c.id_clase}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900">{c.titulo}</div>
                    <div className="text-[11px] text-neutral-500">{c.descripcion}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-700">
                    {c.curso_nombre || `Curso #${c.id_curso}`}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                    {c.url_video ? (
                      <a
                        href={c.url_video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#9E1FFF] underline"
                      >
                        Ver Video
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenAssignModal(c)}
                      className="font-semibold text-purple-600 hover:underline"
                    >
                      Asignar
                    </button>
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClass(c.id_clase)}
                      className="font-semibold text-rose-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {clases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs">
                    No se encontraron clases grabadas en la plataforma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-xs text-neutral-600 pt-2">
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-50 hover:bg-neutral-100"
          >
            Anterior
          </button>
          <button
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-50 hover:bg-neutral-100"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal Crear / Editar Clase */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-4">
              {editingClass ? 'Editar Clase Grabada' : 'Añadir Nueva Clase Grabada'}
            </h3>

            <form onSubmit={handleSaveClass} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Título de la Clase</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Área</label>
                <select
                  value={idArea}
                  onChange={(e) => {
                    const areaId = Number(e.target.value)
                    setIdArea(areaId)
                    const primerCurso = cursos.find((c) => c.id_area === areaId)
                    setIdCurso(primerCurso?.id_curso ?? 0)
                  }}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                >
                  {areas.map((a) => (
                    <option key={a.id_area} value={a.id_area}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Curso Perteneciente</label>
                <select
                  value={idCurso}
                  onChange={(e) => {
                    const cursoId = Number(e.target.value)
                    setIdCurso(cursoId)
                    const curso = cursos.find((c) => c.id_curso === cursoId)
                    if (curso?.id_area) setIdArea(curso.id_area)
                  }}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                >
                  {cursos
                    .filter((c) => c.id_area === idArea)
                    .map((c) => (
                      <option key={c.id_curso} value={c.id_curso}>
                        {c.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Período Académico</label>
                <select
                  value={idPeriodo}
                  onChange={(e) => {
                    const periodoId = Number(e.target.value)
                    setIdPeriodo(periodoId)
                    const periodo = periodos.find((p) => p.id_periodo === periodoId)
                    if (periodo) {
                      setAnioClase(periodo.anio)
                      setNumSemestreClase(periodo.num_semestre)
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                >
                  {periodos.map((p) => (
                    <option key={p.id_periodo} value={p.id_periodo}>
                      Año {p.anio} · Semestre {p.num_semestre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Fecha Impartida</label>
                  <input
                    type="date"
                    required
                    value={fechaImpartida}
                    onChange={(e) => setFechaImpartida(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Hora (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={horaImpartida}
                    onChange={(e) => setHoraImpartida(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={duracionMin}
                  onChange={(e) => setDuracionMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">URL Enlace de Video</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlVideo}
                  onChange={(e) => setUrlVideo(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                >
                  Guardar Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Metadata */}
      {showAssignModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Asignar Metadata a Clase</h3>
            <p className="text-xs text-neutral-500 mb-4 font-semibold text-[#9E1FFF]">
              {selectedClass.titulo}
            </p>

            <div className="flex gap-2 mb-4">
              {(['docente', 'auxiliar', 'tema', 'material'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAssignTab(tab)}
                  className={`flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold ${
                    assignTab === tab
                      ? 'bg-[#9E1FFF] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {tab === 'docente'
                    ? 'Docentes'
                    : tab === 'auxiliar'
                    ? 'Auxiliares'
                    : tab === 'tema'
                    ? 'Temas'
                    : 'Material de Apoyo'}
                </button>
              ))}
            </div>

            {/* Docentes */}
            {assignTab === 'docente' && (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-2">
                    Docentes asignados a la clase
                  </label>
                  <ul className="flex flex-col gap-1.5">
                    {docentesAsignados.length === 0 && (
                      <li className="text-neutral-400">No hay docentes asignados.</li>
                    )}
                    {docentesAsignados.map((d) => (
                      <li
                        key={d.id_usuario}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                      >
                        <span className="text-neutral-800">
                          {d.nombre} {d.apellido}
                        </span>
                        <button
                          onClick={() => handleDesasignarDocente(d.id_usuario)}
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Desasignar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Asignar nuevo docente
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={idDocenteAsignar}
                      onChange={(e) => setIdDocenteAsignar(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      <option value={0}>Seleccionar docente...</option>
                      {docentesDisponibles.map((d) => (
                        <option key={d.id_usuario} value={d.id_usuario}>
                          {d.nombre} {d.apellido}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAsignarDocente}
                      disabled={!idDocenteAsignar}
                      className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9] disabled:opacity-50"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Auxiliares */}
            {assignTab === 'auxiliar' && (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-2">
                    Auxiliares asignados a la clase
                  </label>
                  <ul className="flex flex-col gap-1.5">
                    {auxiliaresAsignados.length === 0 && (
                      <li className="text-neutral-400">No hay auxiliares asignados.</li>
                    )}
                    {auxiliaresAsignados.map((a) => (
                      <li
                        key={a.id_usuario}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                      >
                        <span className="text-neutral-800">
                          {a.nombre} {a.apellido}
                        </span>
                        <button
                          onClick={() => handleDesasignarAuxiliar(a.id_usuario)}
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Desasignar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Asignar nuevo auxiliar
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={idAuxiliarAsignar}
                      onChange={(e) => setIdAuxiliarAsignar(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      <option value={0}>Seleccionar auxiliar...</option>
                      {auxiliaresDisponibles.map((a) => (
                        <option key={a.id_usuario} value={a.id_usuario}>
                          {a.nombre} {a.apellido}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAsignarAuxiliar}
                      disabled={!idAuxiliarAsignar}
                      className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9] disabled:opacity-50"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Temas */}
            {assignTab === 'tema' && (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-2">
                    Temas asignados a la clase
                  </label>
                  <ul className="flex flex-col gap-1.5">
                    {temasAsignados.length === 0 && (
                      <li className="text-neutral-400">No hay temas asignados.</li>
                    )}
                    {temasAsignados.map((t) => (
                      <li
                        key={t.id_tema}
                        className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                      >
                        <span className="text-neutral-800">{t.nombre}</span>
                        <button
                          onClick={() => handleDesasignarTema(t.id_tema)}
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Desasignar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Asignar nuevo tema
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={idTemaAsignar}
                      onChange={(e) => setIdTemaAsignar(Number(e.target.value))}
                      className="flex-1 rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    >
                      <option value={0}>Seleccionar tema...</option>
                      {temasDisponibles.map((t) => (
                        <option key={t.id_tema} value={t.id_tema}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAsignarTema}
                      disabled={!idTemaAsignar}
                      className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9] disabled:opacity-50"
                    >
                      Asignar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Material de Apoyo */}
            {assignTab === 'material' && (
              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-2">
                    Material de apoyo asignado
                  </label>
                  <ul className="flex flex-col gap-1.5">
                    {materialesClase.length === 0 && (
                      <li className="text-neutral-400">No hay material de apoyo asignado.</li>
                    )}
                    {materialesClase.map((m) => (
                      <li
                        key={m.id_material}
                        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2"
                      >
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#9E1FFF] underline truncate"
                        >
                          {m.nombre}
                        </a>
                        <button
                          onClick={() => handleEliminarMaterial(m.id_material)}
                          className="font-semibold text-rose-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleAsignarMaterial} className="flex flex-col gap-3">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      Nombre del documento
                    </label>
                    <input
                      type="text"
                      required
                      value={materialNombre}
                      onChange={(e) => setMaterialNombre(e.target.value)}
                      placeholder="Ej. Guía de laboratorio #3"
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      URL del documento
                    </label>
                    <input
                      type="url"
                      required
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                    >
                      Añadir Material
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
