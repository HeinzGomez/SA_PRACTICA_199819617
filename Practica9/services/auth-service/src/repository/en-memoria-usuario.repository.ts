// HeinzGomez - Práctica 9: repositorio en memoria (pruebas / entornos sin base de datos)
import { UsuarioConHash } from '../types/usuario';
import { UsuarioRepository } from './usuario.repository';

export class EnMemoriaUsuarioRepository implements UsuarioRepository {
  private readonly datos = new Map<string, UsuarioConHash>();

  async buscarPorCorreo(correo: string) {
    return [...this.datos.values()].find((u) => u.correo === correo) ?? null;
  }

  async buscarPorId(id: string) {
    return this.datos.get(id) ?? null;
  }

  async crear(u: UsuarioConHash) {
    this.datos.set(u.id, u);
  }
}
