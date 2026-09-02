export interface AsignarRolInput {
  id_usuario: number;
  id_rol: number;
}

export interface ComprobarRolInput {
  id_usuario: number;
  nombre_rol: string;
}

export interface CambiarRolInput {
  id_usuario: number;
  id_rol_actual: number;
  id_rol_nuevo: number;
}

export interface EliminarRolInput {
  id_usuario: number;
  id_rol: number;
}
