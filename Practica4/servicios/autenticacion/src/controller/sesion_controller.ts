import { sendUnaryData, ServerUnaryCall, ServiceError, status } from "@grpc/grpc-js";
import { SesionService } from "../services/sesion_services";
import { UserService } from "../services/user_services";
import { SesionRow } from "../types/sesion.types";
import { UsuarioRow } from "../types/user.types";
import {
  CerrarSesionRequest,
  CerrarSesionResponse,
  CrearSesionRequest,
  CrearSesionResponse,
  SesionResponse,
  ValidarSesionRequest,
  ValidarSesionResponse,
} from "../types/sesion.controller.types";
import { UsuarioResponse } from "../types/user.controller.types";

export class SesionController {
  constructor(
    private userService: UserService,
    private sesionService: SesionService
  ) {}

  async crearSesion(
    call: ServerUnaryCall<CrearSesionRequest, CrearSesionResponse>,
    callback: sendUnaryData<CrearSesionResponse>
  ): Promise<void> {
    try {
      const { correo, password } = call.request;

      const usuario = await this.userService.verificarCredenciales({ correo, password });
      if (!usuario) {
        throw new Error("Credenciales inválidas");
      }

      const { accessToken, refreshToken, sesion } =
        await this.sesionService.crearSesion(usuario.id_usuario);

      callback(null, {
        exito: true,
        mensaje: "Sesión iniciada exitosamente",
        access_token: accessToken,
        refresh_token: refreshToken,
        sesion: this.mapSesion(sesion),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async cerrarSesion(
    call: ServerUnaryCall<CerrarSesionRequest, CerrarSesionResponse>,
    callback: sendUnaryData<CerrarSesionResponse>
  ): Promise<void> {
    try {
      await this.sesionService.cerrarSesion(call.request.id_sesion);

      callback(null, {
        exito: true,
        mensaje: "Sesión cerrada exitosamente",
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async validarSesion(
    call: ServerUnaryCall<ValidarSesionRequest, ValidarSesionResponse>,
    callback: sendUnaryData<ValidarSesionResponse>
  ): Promise<void> {
    try {
      const { sesion, usuario } =
        await this.sesionService.validarSesion(call.request.access_token);

      callback(null, {
        exito: true,
        mensaje: "Sesión válida",
        sesion: this.mapSesion(sesion),
        usuario: this.mapUsuario(usuario),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  private mapSesion(sesion: SesionRow): SesionResponse {
    return {
      id_sesion: sesion.id_sesion,
      id_usuario: sesion.id_usuario,
      fecha_creacion: sesion.fecha_creacion.toISOString(),
      fecha_expiracion: sesion.fecha_expiracion.toISOString(),
      estado: sesion.estado,
    };
  }

  private mapUsuario(usuario: UsuarioRow): UsuarioResponse {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo_institucional: usuario.correo_institucional,
      estado: usuario.estado,
      fecha_registro: usuario.fecha_registro.toISOString(),
    };
  }

  private buildError(code: number, mensaje: string): ServiceError {
    const error = new Error(mensaje) as ServiceError;
    error.code = code;
    error.details = mensaje;
    return error;
  }
}
