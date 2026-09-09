export interface AsignarRolParams {
  id_usuario: number;
  id_rol: number;
}

export interface RolRow {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
}

export interface UsuarioRolRow {
  id_usuario: number;
  id_rol: number;
  rol: string;
  descripcion: string | null;
}

export interface ComprobarRolParams {
  id_usuario: number;
  nombre_rol: string;
}

export interface CambiarRolParams {
  id_usuario: number;
  id_rol_actual: number;
  id_rol_nuevo: number;
}

export interface EliminarRolParams {
  id_usuario: number;
  id_rol: number;
}
