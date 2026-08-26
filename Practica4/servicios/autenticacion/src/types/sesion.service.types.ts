import { SesionRow } from "./sesion.types";
import { UsuarioRow } from "./user.types";

export interface SesionJwtPayload {
  id_sesion: number;
  id_usuario: number;
}

export interface CrearSesionResult {
  accessToken: string;
  refreshToken: string;
  fechaExpiracion: Date;
  sesion: SesionRow;
}

export interface ValidarSesionResult {
  sesion: SesionRow;
  usuario: UsuarioRow;
}
