import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { RolService } from "../services/rol_service";
import { UsuarioRolRow } from "../types/rol.types";
import {
  AsignarRolUsuarioRequest,
  AsignarRolUsuarioResponse,
  CambiarRolUsuarioRequest,
  CambiarRolUsuarioResponse,
  ComprobarRolUsuarioRequest,
  ComprobarRolUsuarioResponse,
  ConsultarRolesUsuarioRequest,
  ConsultarRolesUsuarioResponse,
  EliminarRolUsuarioRequest,
  EliminarRolUsuarioResponse,
  UsuarioRolResponse,
} from "../types/rol.controller.types";
import { buildError } from "./error_mapper";

export class RolController {
  constructor(private rolService: RolService) {}

  async asignarRol(
    call: ServerUnaryCall<AsignarRolUsuarioRequest, AsignarRolUsuarioResponse>,
    callback: sendUnaryData<AsignarRolUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario, id_rol } = call.request;

      await this.rolService.asignarRol({ id_usuario, id_rol });

      callback(null, {
        exito: true,
        mensaje: "Rol asignado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async comprobarRol(
    call: ServerUnaryCall<ComprobarRolUsuarioRequest, ComprobarRolUsuarioResponse>,
    callback: sendUnaryData<ComprobarRolUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario, nombre_rol } = call.request;

      const tieneRol = await this.rolService.comprobarRol({ id_usuario, nombre_rol });

      callback(null, {
        exito: true,
        mensaje: tieneRol ? "El usuario tiene el rol" : "El usuario no tiene el rol",
        tiene_rol: tieneRol,
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async consultarRolesUsuario(
    call: ServerUnaryCall<ConsultarRolesUsuarioRequest, ConsultarRolesUsuarioResponse>,
    callback: sendUnaryData<ConsultarRolesUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario } = call.request;

      const roles = await this.rolService.rolesDeUsuario(id_usuario);

      callback(null, {
        exito: true,
        mensaje: "Roles consultados exitosamente",
        roles: roles.map((rol) => this.mapUsuarioRol(rol)),
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async cambiarRol(
    call: ServerUnaryCall<CambiarRolUsuarioRequest, CambiarRolUsuarioResponse>,
    callback: sendUnaryData<CambiarRolUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario, id_rol_actual, id_rol_nuevo } = call.request;

      await this.rolService.cambiarRol({ id_usuario, id_rol_actual, id_rol_nuevo });

      callback(null, {
        exito: true,
        mensaje: "Rol cambiado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  async eliminarRol(
    call: ServerUnaryCall<EliminarRolUsuarioRequest, EliminarRolUsuarioResponse>,
    callback: sendUnaryData<EliminarRolUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario, id_rol } = call.request;

      await this.rolService.eliminarRol({ id_usuario, id_rol });

      callback(null, {
        exito: true,
        mensaje: "Rol eliminado exitosamente",
      });
    } catch (error) {
      callback(buildError(error));
    }
  }

  private mapUsuarioRol(rol: UsuarioRolRow): UsuarioRolResponse {
    return {
      id_usuario: rol.id_usuario,
      id_rol: rol.id_rol,
      rol: rol.rol,
      descripcion: rol.descripcion,
    };
  }
}
