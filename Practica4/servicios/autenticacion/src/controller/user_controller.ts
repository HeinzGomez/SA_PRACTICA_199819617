import { sendUnaryData, ServerUnaryCall, ServiceError, status } from "@grpc/grpc-js";

import { UserService } from "../services/user_services";
import { GoogleOAuthService } from "../services/google-oauth_service";
import { OAuthStateService } from "../services/oauth-state_service";
import { SesionService } from "../services/sesion_services";


import { UsuarioRow } from "../types/user.types";
import { SesionRow } from "../types/sesion.types";
import {
  CambiarPasswordRequest,
  CambiarPasswordResponse,
  ConsultarUsuarioRequest,
  ConsultarUsuarioResponse,
  ConsultarUsuariosRequest,
  ConsultarUsuariosResponse,
  RegistrarUsuarioRequest,
  RegistrarUsuarioResponse,
  UsuarioResponse,
  IniciarOAuthGoogleRequest,
  IniciarOAuthGoogleResponse,
  AutenticarConGoogleRequest,
  AutenticarConGoogleResponse,
} from "../types/user.controller.types";

export class UserController {
  constructor(
    private userService: UserService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly oauthStateService: OAuthStateService,
    private readonly authSessionService: SesionService
  ) {}

  async registrarUsuario(
    call: ServerUnaryCall<RegistrarUsuarioRequest, RegistrarUsuarioResponse>,
    callback: sendUnaryData<RegistrarUsuarioResponse>
  ): Promise<void> {
    try {
      const { nombre, apellido, correo, password } = call.request;

      const usuario = await this.userService.registrarUsuario({
        nombre,
        apellido,
        correo,
        password,
      });

      callback(null, {
        exito: true,
        mensaje: "Usuario registrado exitosamente",
        usuario: this.mapUsuario(usuario),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async cambiarPassword(
    call: ServerUnaryCall<CambiarPasswordRequest, CambiarPasswordResponse>,
    callback: sendUnaryData<CambiarPasswordResponse>
  ): Promise<void> {
    try {
      const { id_usuario, password_actual, password_nueva } = call.request;

      await this.userService.cambiarPassword({
        id_usuario,
        password_actual,
        password_nueva,
      });

      callback(null, {
        exito: true,
        mensaje: "Contraseña actualizada exitosamente",
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async consultarUsuario(
    call: ServerUnaryCall<ConsultarUsuarioRequest, ConsultarUsuarioResponse>,
    callback: sendUnaryData<ConsultarUsuarioResponse>
  ): Promise<void> {
    try {
      const { id_usuario } = call.request;

      const usuario = await this.userService.obtenerUsuario(id_usuario);

      if (!usuario) {
        callback(this.buildError(status.NOT_FOUND, "El usuario no existe"));
        return;
      }

      callback(null, {
        exito: true,
        mensaje: "Usuario consultado exitosamente",
        usuario: this.mapUsuario(usuario),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async consultarUsuarios(
    call: ServerUnaryCall<ConsultarUsuariosRequest, ConsultarUsuariosResponse>,
    callback: sendUnaryData<ConsultarUsuariosResponse>
  ): Promise<void> {
    try {
      const usuarios = await this.userService.listarUsuarios();

      callback(null, {
        exito: true,
        mensaje: "Usuarios consultados exitosamente",
        usuarios: usuarios.map((usuario) => this.mapUsuario(usuario)),
      });
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error interno del servidor";
      callback(this.buildError(status.INVALID_ARGUMENT, mensaje));
    }
  }

  async iniciarOAuthGoogle(
    call: ServerUnaryCall<
      IniciarOAuthGoogleRequest,
      IniciarOAuthGoogleResponse
    >,
    callback: sendUnaryData<IniciarOAuthGoogleResponse>
  ): Promise<void> {
    try {
      let state = call.request.state;

      if (!state) {
        state = this.oauthStateService.generarState();
      }

      const authorizationUrl =
        this.googleOAuthService.generarAuthorizationUrl(
          state
        );

      callback(null, {
        exito: true,
        mensaje: "URL de autorización generada exitosamente",
        authorization_url: authorizationUrl,
      });
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No fue posible iniciar la autenticación con Google";

      callback(
        this.buildError(
          status.INTERNAL,
          mensaje
        )
      );
    }
  }

  async autenticarConGoogle(
    call: ServerUnaryCall<
      AutenticarConGoogleRequest,
      AutenticarConGoogleResponse
    >,
    callback: sendUnaryData<AutenticarConGoogleResponse>
  ): Promise<void> {
    try {
      const {
        code,
        state,
      } = call.request;

      if (!code) {
        callback(
          this.buildError(
            status.INVALID_ARGUMENT,
            "El código de autorización de Google es obligatorio"
          )
        );
        return;
      }

      if (!state) {
        callback(
          this.buildError(
            status.INVALID_ARGUMENT,
            "El parámetro state es obligatorio"
          )
        );
        return;
      }

      const stateValido =
        this.oauthStateService.validarState(state);

      if (!stateValido) {
        callback(
          this.buildError(
            status.UNAUTHENTICATED,
            "El state de OAuth no es válido o ha expirado"
          )
        );
        return;
      }

      const tokens =
        await this.googleOAuthService.obtenerTokens(
          code
        );

      const googleUser =
        await this.googleOAuthService.obtenerUsuario(
          tokens
        );

      const usuario =
        await this.userService.autenticarConGoogle(
          googleUser
        );

      const sesion =
        await this.authSessionService.crearSesion(
          usuario.id_usuario
        );

      callback(null, {
        exito: true,
        mensaje: "Autenticación con Google exitosa",
        access_token: sesion.accessToken,
        refresh_token: sesion.refreshToken,
        sesion: this.mapSesion(sesion.sesion),
        usuario: this.mapUsuario(usuario),
      });

    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "Error interno durante la autenticación con Google";

      callback(
        this.buildError(
          this.obtenerCodigoError(error),
          mensaje
        )
      );
    }
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

  private mapSesion(sesion: SesionRow) {
    return {
      id_sesion: sesion.id_sesion,
      id_usuario: sesion.id_usuario,
      fecha_creacion: sesion.fecha_creacion.toISOString(),
      fecha_expiracion: sesion.fecha_expiracion.toISOString(),
      estado: sesion.estado,
    };
  }

  private obtenerCodigoError(
    error: unknown
  ): status {
    if (!(error instanceof Error)) {
      return status.INTERNAL;
    }

    const mensaje = error.message.toLowerCase();

    if (
      mensaje.includes("state") ||
      mensaje.includes("google no proporcionó")
    ) {
      return status.UNAUTHENTICATED;
    }

    if (
      mensaje.includes("correo") ||
      mensaje.includes("cuenta")
    ) {
      return status.PERMISSION_DENIED;
    }

    if (
      mensaje.includes("inactivo")
    ) {
      return status.PERMISSION_DENIED;
    }

    return status.INTERNAL;
  }

  private buildError(code: number, mensaje: string): ServiceError {
    const error = new Error(mensaje) as ServiceError;
    error.code = code;
    error.details = mensaje;
    return error;
  }
}
