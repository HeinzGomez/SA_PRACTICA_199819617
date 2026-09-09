import React, { useState, useEffect } from 'react'
import { authApi } from '../../api/auth'
import { inscripcionApi } from '../../api/inscripcion'
import type { UserRoleItem } from '../../types/admin.types'

const ROLES_MAP: Record<number, string> = {
  1: 'ESTUDIANTE',
  2: 'DOCENTE',
  3: 'AUXILIAR',
  4: 'ADMINISTRADOR',
}

const ROLES_INV_MAP: Record<string, number> = {
  ESTUDIANTE: 1,
  DOCENTE: 2,
  AUXILIAR: 3,
  ADMINISTRADOR: 4,
}

export const UsersRolesManager: React.FC = () => {
  const [users, setUsers] = useState<UserRoleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserRoleItem | null>(null)
  const [selectedRolStr, setSelectedRolStr] = useState<string>('ESTUDIANTE')
  const [showRoleModal, setShowRoleModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const resUsuarios = await authApi.consultarUsuarios()

      if (!resUsuarios.exito) {
        setMessage({
          type: 'error',
          text: resUsuarios.mensaje || 'No se pudo consultar la lista de usuarios del sistema.',
        })
        setUsers([])
        return
      }

      const usuarios = resUsuarios.usuarios ?? []

      const items: UserRoleItem[] = await Promise.all(
        usuarios.map(async (usuario) => {
          let rol = 'SIN ROL'
          try {
            const resRoles = await inscripcionApi.consultarRolesUsuario(usuario.id_usuario)
            if (resRoles.exito && resRoles.roles && resRoles.roles.length > 0) {
              const nombreRol = resRoles.roles[0].rol || ROLES_MAP[resRoles.roles[0].id_rol]
              rol = nombreRol ? nombreRol.toUpperCase() : 'SIN ROL'
            }
          } catch (e) {
            // sin roles: se muestra SIN ROL
          }
          return {
            id_usuario: usuario.id_usuario,
            nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
            correo: usuario.correo_institucional,
            rol,
          }
        })
      )

      setUsers(items)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Error al consultar la lista de usuarios del sistema.' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenRoleModal = async (user: UserRoleItem) => {
    setSelectedUser(user)
    setSelectedRolStr(user.rol === 'SIN ROL' ? 'ESTUDIANTE' : user.rol)

    try {
      const resRoles = await inscripcionApi.consultarRolesUsuario(user.id_usuario)
      if (resRoles.exito && resRoles.roles && resRoles.roles.length > 0) {
        const nombreRol = resRoles.roles[0].rol || ROLES_MAP[resRoles.roles[0].id_rol]
        if (nombreRol) setSelectedRolStr(nombreRol.toUpperCase())
      }
    } catch (e) {
      // keep current fallback
    }

    setShowRoleModal(true)
  }

  const handleAssignRole = async () => {
    if (!selectedUser) return
    setMessage(null)

    try {
      const idRolNuevo = ROLES_INV_MAP[selectedRolStr] || 1
      const tieneRolActual = selectedUser.rol !== 'SIN ROL'
      const res = tieneRolActual
        ? await inscripcionApi.cambiarRol({
            id_usuario: selectedUser.id_usuario,
            id_rol_actual: ROLES_INV_MAP[selectedUser.rol],
            id_rol_nuevo: idRolNuevo,
          })
        : await inscripcionApi.asignarRol({
            id_usuario: selectedUser.id_usuario,
            id_rol: idRolNuevo,
          })

      if (res.exito) {
        setMessage({
          type: 'success',
          text: `Rol "${selectedRolStr}" asignado correctamente a ${selectedUser.nombre}.`,
        })
        setUsers((prev) =>
          prev.map((u) =>
            u.id_usuario === selectedUser.id_usuario ? { ...u, rol: selectedRolStr } : u
          )
        )
      } else {
        setMessage({ type: 'error', text: res.mensaje || 'No se pudo cambiar el rol.' })
      }

      setShowRoleModal(false)
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err.response?.data?.mensaje || 'Error de comunicación con el servicio de roles.',
      })
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Gestión de Usuarios y Roles</h2>
          <p className="text-xs text-neutral-500">
            Consulta los usuarios registrados y gestiona la asignación de sus roles en la plataforma.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar usuario por nombre, correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs outline-none focus:border-[#9E1FFF]"
          />
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

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Cargando usuarios del sistema...
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase tracking-wider font-medium border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo Electrónico</th>
                <th className="px-4 py-3">Rol Actual</th>
                <th className="px-4 py-3 text-right">Acciones de Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.map((user) => (
                <tr key={user.id_usuario} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono text-neutral-500">#{user.id_usuario}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{user.nombre}</td>
                  <td className="px-4 py-3 text-neutral-600 font-mono">{user.correo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        user.rol === 'ADMINISTRADOR'
                          ? 'bg-purple-100 text-purple-800'
                          : user.rol === 'DOCENTE'
                          ? 'bg-blue-100 text-blue-800'
                          : user.rol === 'AUXILIAR'
                          ? 'bg-amber-100 text-amber-800'
                          : user.rol === 'ESTUDIANTE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenRoleModal(user)}
                      className="font-semibold text-[#9E1FFF] hover:underline"
                    >
                      Editar Rol
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400 text-xs">
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Assign Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">Editar Rol de Usuario</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Usuario: <strong className="text-neutral-800">{selectedUser.nombre}</strong> (
              {selectedUser.correo})
            </p>

            <div className="flex flex-col gap-3 text-xs">
              <label className="font-semibold text-neutral-700">Seleccionar Rol Destino:</label>
              <select
                value={selectedRolStr}
                onChange={(e) => setSelectedRolStr(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2.5 outline-none focus:border-[#9E1FFF]"
              >
                {Object.keys(ROLES_INV_MAP).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignRole}
                  className="rounded-lg bg-[#9E1FFF] px-4 py-2 font-semibold text-white hover:bg-[#7a00c9]"
                >
                  Guardar Rol
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
