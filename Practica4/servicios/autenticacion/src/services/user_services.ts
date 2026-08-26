import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user_repository";
import { UsuarioRow } from "../types/user.types";
import {
  CORREO_INSTITUCIONAL_REGEX,
  CambiarPasswordInput,
  CredencialesInput,
  RegistrarUsuarioInput,
} from "../types/user.service.types";
import { OAuthUser } from "../types/oauth.types";

const SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const ESTADO_ACTIVO = "ACTIVO";

export interface UserService {
  registrarUsuario(input: RegistrarUsuarioInput): Promise<UsuarioRow>;
  verificarCredenciales(input: CredencialesInput): Promise<UsuarioRow | null>;
  cambiarPassword(input: CambiarPasswordInput): Promise<void>;
  obtenerUsuario(id_usuario: number): Promise<UsuarioRow | null>;
  listarUsuarios(): Promise<UsuarioRow[]>;

  autenticarConGoogle(googleUser: OAuthUser): Promise<UsuarioRow>;
}

export class UserServiceImp implements UserService {
  constructor(private userRepository: UserRepository) {}

  async registrarUsuario(input: RegistrarUsuarioInput): Promise<UsuarioRow> {
    this.validarRegistro(input);

    const yaExiste = await this.userRepository.buscarPorCorreo(input.correo);
    if (yaExiste) {
      throw new Error("El correo institucional ya se encuentra registrado");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    return this.userRepository.crear({
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
      correo: input.correo.trim().toLowerCase(),
      password_hash: passwordHash,
      estado: ESTADO_ACTIVO,
    });
  }

  async verificarCredenciales(input: CredencialesInput): Promise<UsuarioRow | null> {
    const correo = input.correo.trim().toLowerCase();
    const hash = await this.userRepository.passwordHash(correo);
    if (!hash) {
      return null;
    }

    const esValida = await bcrypt.compare(input.password, hash);
    if (!esValida) {
      return null;
    }

    return this.userRepository.buscarPorCorreo(correo);
  }

  async cambiarPassword(input: CambiarPasswordInput): Promise<void> {
    if (!input.password_actual || !input.password_nueva) {
      throw new Error("Todos los campos son obligatorios");
    }

    const usuario = await this.userRepository.buscarPorId(input.id_usuario);
    if (!usuario) {
      throw new Error("El usuario no existe");
    }

    const hashActual = await this.userRepository.passwordHashPorId(input.id_usuario);
    if (!hashActual) {
      throw new Error("No se pudo verificar la contraseña actual");
    }

    const esValida = await bcrypt.compare(input.password_actual, hashActual);
    if (!esValida) {
      throw new Error("La contraseña actual es incorrecta");
    }

    if (input.password_nueva.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }

    const passwordHashNuevo = await bcrypt.hash(input.password_nueva, SALT_ROUNDS);
    await this.userRepository.actualizarPassword({
      id_usuario: input.id_usuario,
      password_hash: passwordHashNuevo,
    });
  }

  async obtenerUsuario(id_usuario: number): Promise<UsuarioRow | null> {
    return this.userRepository.buscarPorId(id_usuario);
  }

  async listarUsuarios(): Promise<UsuarioRow[]> {
    return this.userRepository.listarTodos();
  }

  async autenticarConGoogle( googleUser: OAuthUser): Promise<UsuarioRow> {


    this.validarUsuarioGoogle(googleUser);

    const correo = googleUser.email.trim().toLowerCase();


    const usuarioGoogle =
      await this.userRepository.obtenerPorGoogleId(
        googleUser.providerId
      );

    if (usuarioGoogle) {
      this.validarUsuarioActivo(usuarioGoogle);

      return usuarioGoogle;
    }

    const usuarioCorreo =
      await this.userRepository.buscarPorCorreo(correo);

    if (usuarioCorreo) {

      this.validarUsuarioActivo(usuarioCorreo);

      if (!usuarioCorreo.google_id) {
        await this.userRepository.asociarGoogleId(
          usuarioCorreo.id_usuario,
          googleUser.providerId
        );

        return {
          ...usuarioCorreo,
          google_id: googleUser.providerId,
        };
      }

      if (
        usuarioCorreo.google_id !==
        googleUser.providerId
      ) {
        throw new Error(
          "El correo institucional ya está vinculado a otra cuenta de Google"
        );
      }

      return usuarioCorreo;
    }

    return this.userRepository.crearUsuarioGoogle({
      nombre: googleUser.firstName ?? googleUser.name,
      apellido: googleUser.lastName ?? "",
      correo,
      googleId: googleUser.providerId,
      estado: ESTADO_ACTIVO,
    });
  }

  private validarRegistro(input: RegistrarUsuarioInput): void {
    if (
      !input.nombre?.trim() ||
      !input.apellido?.trim() ||
      !input.correo?.trim() ||
      !input.password
    ) {
      throw new Error("Todos los campos son obligatorios");
    }

    if (!CORREO_INSTITUCIONAL_REGEX.test(input.correo.trim().toLowerCase())) {
      throw new Error(
        "El correo debe pertenecer al dominio institucional de la Facultad de Ingeniería"
      );
    }

    if (input.password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
    }
  }

  private validarUsuarioGoogle(googleUser: OAuthUser): void {

    if (!googleUser.providerId) {
      throw new Error(
        "Google no proporcionó un identificador de usuario"
      );
    }

    if (!googleUser.email) {
      throw new Error(
        "Google no proporcionó un correo electrónico"
      );
    }

    if (!googleUser.name) {
      throw new Error(
        "Google no proporcionó el nombre del usuario"
      );
    }

    const correo =
      googleUser.email.trim().toLowerCase();

    if (
      !CORREO_INSTITUCIONAL_REGEX.test(correo)
    ) {
      throw new Error(
        "La cuenta de Google debe utilizar un correo institucional de la Facultad de Ingeniería"
      );
    }
  }

  private validarUsuarioActivo(
    usuario: UsuarioRow
  ): void {

    if (
      usuario.estado !== ESTADO_ACTIVO
    ) {
      throw new Error(
        "El usuario se encuentra inactivo"
      );
    }
  }

  
}
