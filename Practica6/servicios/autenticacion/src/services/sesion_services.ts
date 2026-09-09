import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/environment";
import { SesionRepository } from "../repositories/sesion_repository";
import { UserRepository } from "../repositories/user_repository";
import { SesionJwtPayload, CrearSesionResult, ValidarSesionResult } from "../types/sesion.service.types";

const REFRESH_TOKEN_BYTES = 32;

export interface SesionService {
  crearSesion(idUsuario: number): Promise<CrearSesionResult>;
  cerrarSesion(idSesion: number): Promise<void>;
  validarSesion(accessToken: string): Promise<ValidarSesionResult>;
}

export class SesionServiceImp implements SesionService {
  constructor(
    private sesionRepository: SesionRepository,
    private userRepository: UserRepository
  ) {}

  async crearSesion(idUsuario: number): Promise<CrearSesionResult> {
    const fechaExpiracion = new Date(
      Date.now() + config.jwt.expiresMinutes * 60 * 1000
    );

    const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const tokenHash = this.hashToken(refreshToken);

    const sesion = await this.sesionRepository.crear({
      id_usuario: idUsuario,
      token_hash: tokenHash,
      fecha_expiracion: fechaExpiracion,
    });

    const accessToken = this.generarAccessToken({
      id_sesion: sesion.id_sesion,
      id_usuario: idUsuario,
    });

    return { accessToken, refreshToken, fechaExpiracion, sesion };
  }

  async cerrarSesion(idSesion: number): Promise<void> {
    if (!idSesion) {
      throw new Error("El id de la sesión es obligatorio");
    }
    await this.sesionRepository.cerrar(idSesion);
  }

  async validarSesion(accessToken: string): Promise<ValidarSesionResult> {
    if (!accessToken) {
      throw new Error("El token de acceso es obligatorio");
    }

    const payload = this.verificarAccessToken(accessToken);

    const valida = await this.sesionRepository.validar(payload.id_sesion);
    if (!valida) {
      throw new Error("La sesión no es válida o ha expirado");
    }

    const sesion = await this.sesionRepository.buscarPorId(payload.id_sesion);
    if (!sesion) {
      throw new Error("La sesión no existe");
    }

    const usuario = await this.userRepository.buscarPorId(payload.id_usuario);
    if (!usuario) {
      throw new Error("El usuario de la sesión no existe");
    }

    return { sesion, usuario };
  }

  generarAccessToken(payload: SesionJwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: `${config.jwt.expiresMinutes}m`,
    });
  }

  private verificarAccessToken(accessToken: string): SesionJwtPayload {
    try {
      return jwt.verify(accessToken, config.jwt.secret) as SesionJwtPayload;
    } catch {
      throw new Error("Token de acceso inválido o expirado");
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
