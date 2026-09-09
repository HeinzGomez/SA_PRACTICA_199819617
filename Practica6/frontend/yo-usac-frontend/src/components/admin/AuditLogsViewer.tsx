import React, { useState, useEffect } from 'react'
import { authApi } from '../../api/auth'
import { inscripcionApi } from '../../api/inscripcion'
import { grabacionesApi } from '../../api/grabaciones'
import { historyApi } from '../../api/history'
import { notificacionesApi } from '../../api/notificaciones'

type ServiceType = 'auth' | 'inscripcion' | 'grabaciones' | 'historial' | 'notificaciones'

interface AuditLogEntry {
  id_log: number
  usuario_id: number
  accion: string
  tabla: string
  detalles: string
  fecha: string
  ip?: string
}

export const AuditLogsViewer: React.FC = () => {
  const [currentService, setCurrentService] = useState<ServiceType>('auth')
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Filters
  const [pagina, setPagina] = useState<number>(1)
  const [usuarioFiltro, setUsuarioFiltro] = useState<number>(0)
  const [tablaFiltro, setTablaFiltro] = useState<string>('')

  useEffect(() => {
    fetchAuditLogs()
  }, [currentService, pagina])

  const fetchAuditLogs = async () => {
    setLoading(true)
    setMessage(null)
    try {
      let res: any

      if (currentService === 'auth') {
        res = await authApi.consultarAudit({
          pagina,
          usuario_filtro: usuarioFiltro || 0,
          tabla_filtro: tablaFiltro || '',
        })
      } else if (currentService === 'inscripcion') {
        res = await inscripcionApi.consultarAudit({
          pagina,
          usuario_filtro: usuarioFiltro || 0,
          tabla_filtro: tablaFiltro || '',
        })
      } else if (currentService === 'grabaciones') {
        res = await grabacionesApi.consultarAudit({
          pagina,
          usuario_filtro: usuarioFiltro || 0,
          tabla_filtro: tablaFiltro || '',
        })
      } else if (currentService === 'historial') {
        res = await historyApi.consultarAudit({
          pagina,
          usuario_filtro: usuarioFiltro || 0,
          tabla_filtro: tablaFiltro || '',
        })
      } else if (currentService === 'notificaciones') {
        res = await notificacionesApi.consultarAudit({
          pagina,
          usuario_filtro: usuarioFiltro || 0,
          tabla_filtro: tablaFiltro || '',
        })
      }

      if (res && res.exito && (res.registros || res.logs || res.data)) {
        const rawLogs = res.registros || res.logs || res.data || []
        setLogs(
          rawLogs.map((item: any, idx: number) => ({
            id_log: item.id || item.id_log || idx + 1,
            usuario_id: item.usuario_id || item.id_usuario,
            accion: item.accion || item.operacion,
            tabla: item.tabla || item.entidad,
            detalles: item.detalles || item.mensaje || item.descripcion,
            fecha: item.fecha || item.created_at,
          }))
        )
      } else {
        setLogs([])
      }
    } catch (err: any) {
      console.error(err)
      setMessage('Error al cargar la bitácora de auditoría para el servicio seleccionado.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setPagina(1)
    fetchAuditLogs()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900">Audit Logs & Bitácora de Microservicios</h2>
        <p className="text-xs text-neutral-500">
          Consulta y filtra los logs de auditoría de todos los microservicios independientes del sistema.
        </p>
      </div>

      {/* Service Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        {[
          { key: 'auth', label: 'Auth & Usuarios' },
          { key: 'inscripcion', label: 'Inscripción & Catálogo' },
          { key: 'grabaciones', label: 'Clases & Grabaciones' },
          { key: 'historial', label: 'Historial & Progreso' },
          { key: 'notificaciones', label: 'Notificaciones' },
        ].map((srv) => (
          <button
            key={srv.key}
            onClick={() => {
              setCurrentService(srv.key as ServiceType)
              setPagina(1)
            }}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              currentService === srv.key
                ? 'bg-[#9E1FFF] text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {srv.label}
          </button>
        ))}
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleApplyFilter}
        className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-xs shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Filtrar por Usuario ID</label>
            <input
              type="number"
              placeholder="ID Usuario (0 todos)"
              value={usuarioFiltro || ''}
              onChange={(e) => setUsuarioFiltro(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 outline-none focus:border-[#9E1FFF]"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-600 mb-1">Filtrar por Tabla / Entidad</label>
            <input
              type="text"
              placeholder="Ej. usuarios, cursos..."
              value={tablaFiltro}
              onChange={(e) => setTablaFiltro(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 outline-none focus:border-[#9E1FFF]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#9E1FFF] px-4 py-1.5 font-semibold text-white hover:bg-[#7a00c9]"
          >
            {loading ? 'Cargando...' : 'Aplicar Filtro'}
          </button>
        </div>
      </form>

      {message && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
          {message}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Consultando registros de auditoría del servicio {currentService.toUpperCase()}...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">ID Log</th>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Usuario ID</th>
                <th className="px-4 py-3">Acción / Operación</th>
                <th className="px-4 py-3">Tabla / Entidad</th>
                <th className="px-4 py-3">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id_log} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-neutral-500">#{log.id_log}</td>
                  <td className="px-4 py-3 font-mono text-neutral-600 text-[11px]">
                    {new Date(log.fecha).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">User #{log.usuario_id}</td>
                  <td className="px-4 py-3 font-mono text-[#9E1FFF] font-semibold">{log.accion}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-700">
                      {log.tabla}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 text-[11px] max-w-xs truncate">
                    {log.detalles}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                    No hay registros de auditoría para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-xs text-neutral-600 pt-2">
        <span>Página actual: {pagina}</span>
        <div className="flex gap-2">
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 disabled:opacity-50 hover:bg-neutral-100"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina((p) => p + 1)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
