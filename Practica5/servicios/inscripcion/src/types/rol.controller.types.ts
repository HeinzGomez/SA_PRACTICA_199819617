export interface AsignarRolUsuarioRequest {
  id_usuario: number;
  id_rol: number;
}

export interface AsignarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
}

export interface ComprobarRolUsuarioRequest {
  id_usuario: number;
  nombre_rol: string;
}

export interface ComprobarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
  tiene_rol: boolean;
}

export interface ConsultarRolesUsuarioRequest {
  id_usuario: number;
}

export interface UsuarioRolResponse {
  id_usuario: number;
  id_rol: number;
  rol: string;
  descripcion: string | null;
}

export interface ConsultarRolesUsuarioResponse {
  exito: boolean;
  mensaje: string;
  roles: UsuarioRolResponse[];
}

export interface CambiarRolUsuarioRequest {
  id_usuario: number;
  id_rol_actual: number;
  id_rol_nuevo: number;
}

export interface CambiarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
}

export interface EliminarRolUsuarioRequest {
  id_usuario: number;
  id_rol: number;
}

export interface EliminarRolUsuarioResponse {
  exito: boolean;
  mensaje: string;
}
