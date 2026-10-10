// HeinzGomez - Práctica 9: puerto de persistencia de usuarios (DIP: el servicio depende de la abstracción)
import { UsuarioConHash } from '../types/usuario';

export interface UsuarioRepository {
  buscarPorCorreo(correo: string): Promise<UsuarioConHash | null>;
  buscarPorId(id: string): Promise<UsuarioConHash | null>;
  crear(u: UsuarioConHash): Promise<void>;
}
