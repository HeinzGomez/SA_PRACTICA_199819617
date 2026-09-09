import { inscripcionApi } from '../api/inscripcion'
import { getUserId } from '../store/session.store'

const ROLES_CON_ACCESO_ADMIN = ['administrador', 'docente', 'auxiliar']
const ID_ROL_ESTUDIANTE = 1

export function tieneAccesoPanelAdmin(
  roles: { rol?: string; id_rol?: number }[]
): boolean {
  if (!roles || roles.length === 0) return false
  return roles.some((rolUsuario) => {
    const nombre = (rolUsuario.rol || '').trim().toLowerCase()
    if (ROLES_CON_ACCESO_ADMIN.includes(nombre)) return true
    return rolUsuario.id_rol != null && rolUsuario.id_rol !== ID_ROL_ESTUDIANTE
  })
}

export async function consultarAccesoPanelAdmin(): Promise<boolean> {
  const idUsuario = getUserId()
  if (!idUsuario) return false
  try {
    const response = await inscripcionApi.consultarRolesUsuario(idUsuario)
    if (response.exito && response.roles) {
      return tieneAccesoPanelAdmin(response.roles)
    }
    return false
  } catch (error) {
    console.warn('No se pudo verificar el rol del usuario:', error)
    return false
  }
}