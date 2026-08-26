export interface CrearUsuarioParams {
  nombre: string;
  apellido: string;
  correo: string;
  password_hash: string;
  estado: string;
}

export interface UsuarioRow {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo_institucional: string;
  password_hash: string | null;
  google_id: string | null;
  estado: string;
  fecha_registro: Date;
}

export interface ActualizarPasswordParams {
  id_usuario: number;
  password_hash: string;
}

export interface CrearUsuarioGoogleData {
  nombre: string;
  apellido: string;
  correo: string;
  googleId: string;
  estado: string;
}