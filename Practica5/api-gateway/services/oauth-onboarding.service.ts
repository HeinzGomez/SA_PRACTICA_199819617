import { InscripcionClient } from "../grpc/ins.client";
import { NotificacionesClient } from "../grpc/not.client";
import { Usuario } from "../types/auth.types";

const ROL_ESTUDIANTE = "Estudiante";
const ID_ROL_ESTUDIANTE = 1;
const NOMBRE_SERVICIO = "OAuth";

export interface OAuthOnboardingService {
  asegurarEstudiante(usuario: Usuario): Promise<boolean>;
}

export class OAuthOnboardingServiceImp implements OAuthOnboardingService {
  constructor(
    private readonly insClient: InscripcionClient,
    private readonly notClient?: NotificacionesClient
  ) {}

  async asegurarEstudiante(usuario: Usuario): Promise<boolean> {
    await this.asegurarRolEstudiante(usuario.id_usuario);
    const perfilCreado = await this.asegurarPerfilAcademico(usuario);

    if (perfilCreado) {
      await this.enviarNotificacionRegistro(usuario);
    }

    return perfilCreado;
  }

  private async asegurarRolEstudiante(idUsuario: number): Promise<void> {
    const res = await this.insClient.comprobarRolUsuario({
      id_usuario: idUsuario,
      nombre_rol: ROL_ESTUDIANTE,
    });

    if (res.exito && !res.tiene_rol) {
      await this.insClient.asignarRolUsuario({
        id_usuario: idUsuario,
        id_rol: ID_ROL_ESTUDIANTE,
      });
      console.log(`[OAuth][Onboarding] Rol ${ROL_ESTUDIANTE} asignado al usuario ${idUsuario}`);
    }
  }

  private async asegurarPerfilAcademico(usuario: Usuario): Promise<boolean> {
    const perfilRes = await this.insClient.consultarPerfilAcademico({
      id_usuario: usuario.id_usuario,
    });

    if (perfilRes.exito && perfilRes.perfil) {
      return false;
    }

    const crearPerfil = await this.insClient.crearPerfilAcademico({
      id_usuario: usuario.id_usuario,
      registro_academico: "",
      dpi: "",
      fecha_nacimiento: "",
      telefono: "",
      id_carrera: 0,
      direccion: "",
    });

    if (crearPerfil.exito && crearPerfil.perfil) {
      console.log(
        `[OAuth][Onboarding] Perfil académico creado para el usuario ${usuario.id_usuario}`
      );
      return true;
    }

    console.error(
      `[OAuth][Onboarding] No se pudo crear el perfil del usuario ${usuario.id_usuario}: ${crearPerfil.mensaje}`
    );
    return false;
  }

  private async enviarNotificacionRegistro(usuario: Usuario): Promise<void> {
    if (!this.notClient) {
      console.warn("[OAuth][Onboarding] Cliente de notificaciones no disponible; no se envió el correo de registro");
      return;
    }

    try {
      const res = await this.notClient.enviarNotificacionRegistro({
        id_usuario: usuario.id_usuario,
        correo: usuario.correo_institucional,
        nombre_usuario: `${usuario.nombre} ${usuario.apellido}`.trim() || usuario.correo_institucional,
      });

      if (res.exito) {
        console.log(
          `[OAuth][Onboarding] Correo de registro enviado al usuario ${usuario.id_usuario} (${usuario.correo_institucional})`
        );
      } else {
        console.warn(
          `[OAuth][Onboarding] No se pudo enviar el correo de registro al usuario ${usuario.id_usuario}: ${res.mensaje}`
        );
      }
    } catch (error) {
      console.warn(
        `[OAuth][Onboarding] Error enviando correo de registro al usuario ${usuario.id_usuario}:`,
        error
      );
    }
  }
}