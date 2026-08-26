export interface CrearSesionParams {
  id_usuario: number;
  token_hash: string;
  fecha_expiracion: Date;
}

export interface SesionRow {
  id_sesion: number;
  id_usuario: number;
  token_hash: string;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  estado: string;
}
