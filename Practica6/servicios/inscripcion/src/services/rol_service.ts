import { RolRepository } from "../repositories/rol_repository";
import { UsuarioRolRow } from "../types/rol.types";
import { AsignarRolInput, CambiarRolInput, ComprobarRolInput, EliminarRolInput } from "../types/rol.service.types";

export interface RolService {
  asignarRol(input: AsignarRolInput): Promise<void>;
  cambiarRol(input: CambiarRolInput): Promise<void>;
  eliminarRol(input: EliminarRolInput): Promise<void>;
  comprobarRol(input: ComprobarRolInput): Promise<boolean>;
  rolesDeUsuario(idUsuario: number): Promise<UsuarioRolRow[]>;
}

export class RolServiceImp implements RolService {
  constructor(private rolRepository: RolRepository) {}

  async asignarRol(input: AsignarRolInput): Promise<void> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");
    this.validarEnteroPositivo(input.id_rol, "El id del rol es obligatorio");

    const rol = await this.rolRepository.buscarRolPorId(input.id_rol);
    if (!rol) {
      throw new Error(`El rol con id '${input.id_rol}' no existe`);
    }

    const roles = await this.rolRepository.rolesDeUsuario(input.id_usuario);
    const yaAsignado = roles.some((r) => r.id_rol === input.id_rol);
    if (yaAsignado) {
      throw new Error(`El usuario ya tiene asignado el rol '${rol.nombre}'`);
    }

    await this.rolRepository.asignarRol({
      id_usuario: input.id_usuario,
      id_rol: input.id_rol,
    });
  }

  async comprobarRol(input: ComprobarRolInput): Promise<boolean> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");

    const nombreRol = input.nombre_rol?.trim() || "";
    if (!nombreRol) {
      throw new Error("El nombre del rol es obligatorio");
    }

    const rol = await this.rolRepository.buscarRolPorNombre(nombreRol);
    if (!rol) {
      throw new Error(`El rol '${nombreRol}' no existe`);
    }

    return this.rolRepository.tieneRol({
      id_usuario: input.id_usuario,
      nombre_rol: nombreRol,
    });
  }

  async rolesDeUsuario(idUsuario: number): Promise<UsuarioRolRow[]> {
    this.validarEnteroPositivo(idUsuario, "El id del usuario es obligatorio");
    return this.rolRepository.rolesDeUsuario(idUsuario);
  }

  async cambiarRol(input: CambiarRolInput): Promise<void> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");
    this.validarEnteroPositivo(input.id_rol_actual, "El id del rol actual es obligatorio");
    this.validarEnteroPositivo(input.id_rol_nuevo, "El id del rol nuevo es obligatorio");

    if (input.id_rol_actual === input.id_rol_nuevo) {
      throw new Error("El rol actual y el nuevo no pueden ser iguales");
    }

    const rolActual = await this.rolRepository.buscarRolPorId(input.id_rol_actual);
    if (!rolActual) {
      throw new Error(`El rol actual con id '${input.id_rol_actual}' no existe`);
    }

    const rolNuevo = await this.rolRepository.buscarRolPorId(input.id_rol_nuevo);
    if (!rolNuevo) {
      throw new Error(`El rol nuevo con id '${input.id_rol_nuevo}' no existe`);
    }

    const roles = await this.rolRepository.rolesDeUsuario(input.id_usuario);
    const tieneRolActual = roles.some((r) => r.id_rol === input.id_rol_actual);
    if (!tieneRolActual) {
      throw new Error(`El usuario no tiene asignado el rol '${rolActual.nombre}'`);
    }

    const yaTieneNuevo = roles.some((r) => r.id_rol === input.id_rol_nuevo);
    if (yaTieneNuevo) {
      throw new Error(`El usuario ya tiene asignado el rol '${rolNuevo.nombre}'`);
    }

    await this.rolRepository.cambiarRol({
      id_usuario: input.id_usuario,
      id_rol_actual: input.id_rol_actual,
      id_rol_nuevo: input.id_rol_nuevo,
    });
  }

  async eliminarRol(input: EliminarRolInput): Promise<void> {
    this.validarEnteroPositivo(input.id_usuario, "El id del usuario es obligatorio");
    this.validarEnteroPositivo(input.id_rol, "El id del rol es obligatorio");

    const rol = await this.rolRepository.buscarRolPorId(input.id_rol);
    if (!rol) {
      throw new Error(`El rol con id '${input.id_rol}' no existe`);
    }

    const roles = await this.rolRepository.rolesDeUsuario(input.id_usuario);
    const tieneRol = roles.some((r) => r.id_rol === input.id_rol);
    if (!tieneRol) {
      throw new Error(`El usuario no tiene asignado el rol '${rol.nombre}'`);
    }

    await this.rolRepository.eliminarRol({
      id_usuario: input.id_usuario,
      id_rol: input.id_rol,
    });
  }

  private validarEnteroPositivo(valor: number, mensaje: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(mensaje);
    }
  }
}
