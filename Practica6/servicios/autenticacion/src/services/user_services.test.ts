import bcrypt from "bcrypt";
import { UserServiceImp, UserService } from "./user_services";
import { UserRepository } from "../repositories/user_repository";
import { UsuarioRow } from "../types/user.types";
import { OAuthUser } from "../types/oauth.types";

jest.mock("bcrypt");
const mockedBcrypt = jest.mocked(bcrypt);

function mockUserRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    crear: jest.fn(),
    buscarPorCorreo: jest.fn(),
    buscarPorId: jest.fn(),
    obtenerPorGoogleId: jest.fn(),
    asociarGoogleId: jest.fn(),
    crearUsuarioGoogle: jest.fn(),
    listarTodos: jest.fn(),
    correoExiste: jest.fn(),
    passwordHash: jest.fn(),
    passwordHashPorId: jest.fn(),
    actualizarPassword: jest.fn(),
    ...overrides,
  };
}

const usuarioBase: UsuarioRow = {
  id_usuario: 1,
  nombre: "Juan",
  apellido: "Perez",
  correo_institucional: "juan.perez@ingenieria.usac.edu.gt",
  password_hash: null,
  google_id: null,
  estado: "ACTIVO",
  fecha_registro: new Date("2025-01-01"),
};

describe("UserServiceImp", () => {
  let service: UserServiceImp;
  let repo: UserRepository;

  beforeEach(() => {
    repo = mockUserRepository();
    service = new UserServiceImp(repo);
    jest.clearAllMocks();
  });

  describe("registrarUsuario", () => {
    const input = {
      nombre: "Juan",
      apellido: "Perez",
      correo: "juan.perez@ingenieria.usac.edu.gt",
      password: "password123",
    };

    it("deberia registrar un usuario exitosamente", async () => {
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue("$2b$10$hashed" as never);
      (repo.crear as jest.Mock).mockResolvedValue(usuarioBase);

      const result = await service.registrarUsuario(input);

      expect(result).toEqual(usuarioBase);
      expect(repo.buscarPorCorreo).toHaveBeenCalledWith(input.correo);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(input.password, 10);
      expect(repo.crear).toHaveBeenCalledWith({
        nombre: "Juan",
        apellido: "Perez",
        correo: "juan.perez@ingenieria.usac.edu.gt",
        password_hash: "$2b$10$hashed",
        estado: "ACTIVO",
      });
    });

    it("deberia fallar si falta el nombre", async () => {
      await expect(
        service.registrarUsuario({ ...input, nombre: "" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si falta el apellido", async () => {
      await expect(
        service.registrarUsuario({ ...input, apellido: "" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si falta el correo", async () => {
      await expect(
        service.registrarUsuario({ ...input, correo: "" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si falta el password", async () => {
      await expect(
        service.registrarUsuario({ ...input, password: "" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si el correo no es institucional", async () => {
      await expect(
        service.registrarUsuario({ ...input, correo: "juan@gmail.com" })
      ).rejects.toThrow("El correo debe pertenecer al dominio institucional");
    });

    it("deberia fallar si el password es muy corto", async () => {
      await expect(
        service.registrarUsuario({ ...input, password: "123" })
      ).rejects.toThrow("La contraseña debe tener al menos 8 caracteres");
    });

    it("deberia fallar si el correo ya esta registrado", async () => {
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(usuarioBase);

      await expect(service.registrarUsuario(input)).rejects.toThrow(
        "El correo institucional ya se encuentra registrado"
      );
    });
  });

  describe("verificarCredenciales", () => {
    it("deberia retornar el usuario si las credenciales son validas", async () => {
      (repo.passwordHash as jest.Mock).mockResolvedValue("$2b$10$hash");
      mockedBcrypt.compare.mockResolvedValue(true as never);
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(usuarioBase);

      const result = await service.verificarCredenciales({
        correo: "juan.perez@ingenieria.usac.edu.gt",
        password: "password123",
      });

      expect(result).toEqual(usuarioBase);
    });

    it("deberia retornar null si el correo no existe", async () => {
      (repo.passwordHash as jest.Mock).mockResolvedValue(null);

      const result = await service.verificarCredenciales({
        correo: "noexiste@ingenieria.usac.edu.gt",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    it("deberia retornar null si la password es incorrecta", async () => {
      (repo.passwordHash as jest.Mock).mockResolvedValue("$2b$10$hash");
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.verificarCredenciales({
        correo: "juan.perez@ingenieria.usac.edu.gt",
        password: "wrongpassword",
      });

      expect(result).toBeNull();
    });
  });

  describe("cambiarPassword", () => {
    it("deberia cambiar la password exitosamente", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);
      (repo.passwordHashPorId as jest.Mock).mockResolvedValue("$2b$10$oldhash");
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue("$2b$10$newhash" as never);
      (repo.actualizarPassword as jest.Mock).mockResolvedValue(undefined);

      await service.cambiarPassword({
        id_usuario: 1,
        password_actual: "oldpassword",
        password_nueva: "newpassword123",
      });

      expect(repo.actualizarPassword).toHaveBeenCalledWith({
        id_usuario: 1,
        password_hash: "$2b$10$newhash",
      });
    });

    it("deberia fallar si falta password_actual", async () => {
      await expect(
        service.cambiarPassword({ id_usuario: 1, password_actual: "", password_nueva: "new12345" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si falta password_nueva", async () => {
      await expect(
        service.cambiarPassword({ id_usuario: 1, password_actual: "old", password_nueva: "" })
      ).rejects.toThrow("Todos los campos son obligatorios");
    });

    it("deberia fallar si el usuario no existe", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.cambiarPassword({ id_usuario: 999, password_actual: "old", password_nueva: "new12345" })
      ).rejects.toThrow("El usuario no existe");
    });

    it("deberia fallar si no se puede obtener el hash actual", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);
      (repo.passwordHashPorId as jest.Mock).mockResolvedValue(null);

      await expect(
        service.cambiarPassword({ id_usuario: 1, password_actual: "old", password_nueva: "new12345" })
      ).rejects.toThrow("No se pudo verificar la contraseña actual");
    });

    it("deberia fallar si la password actual es incorrecta", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);
      (repo.passwordHashPorId as jest.Mock).mockResolvedValue("$2b$10$hash");
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.cambiarPassword({ id_usuario: 1, password_actual: "wrong", password_nueva: "new12345" })
      ).rejects.toThrow("La contraseña actual es incorrecta");
    });

    it("deberia fallar si la nueva password es muy corta", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);
      (repo.passwordHashPorId as jest.Mock).mockResolvedValue("$2b$10$hash");
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(
        service.cambiarPassword({ id_usuario: 1, password_actual: "old", password_nueva: "123" })
      ).rejects.toThrow("La nueva contraseña debe tener al menos 8 caracteres");
    });
  });

  describe("obtenerUsuario", () => {
    it("deberia retornar el usuario", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);
      const result = await service.obtenerUsuario(1);
      expect(result).toEqual(usuarioBase);
    });

    it("deberia retornar null si no existe", async () => {
      (repo.buscarPorId as jest.Mock).mockResolvedValue(null);
      const result = await service.obtenerUsuario(999);
      expect(result).toBeNull();
    });
  });

  describe("listarUsuarios", () => {
    it("deberia retornar la lista de usuarios", async () => {
      (repo.listarTodos as jest.Mock).mockResolvedValue([usuarioBase]);
      const result = await service.listarUsuarios();
      expect(result).toEqual([usuarioBase]);
    });
  });

  describe("autenticarConGoogle", () => {
    const googleUser: OAuthUser = {
      providerId: "google-123",
      email: "juan.perez@ingenieria.usac.edu.gt",
      name: "Juan Perez",
      firstName: "Juan",
      lastName: "Perez",
    };

    it("deberia crear usuario nuevo si no existe google_id ni correo", async () => {
      (repo.obtenerPorGoogleId as jest.Mock).mockResolvedValue(null);
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(null);
      (repo.crearUsuarioGoogle as jest.Mock).mockResolvedValue(usuarioBase);

      const result = await service.autenticarConGoogle(googleUser);

      expect(result).toEqual(usuarioBase);
      expect(repo.crearUsuarioGoogle).toHaveBeenCalledWith({
        nombre: "Juan",
        apellido: "Perez",
        correo: "juan.perez@ingenieria.usac.edu.gt",
        googleId: "google-123",
        estado: "ACTIVO",
      });
    });

    it("deberia retornar usuario existente por google_id", async () => {
      (repo.obtenerPorGoogleId as jest.Mock).mockResolvedValue(usuarioBase);

      const result = await service.autenticarConGoogle(googleUser);

      expect(result).toEqual(usuarioBase);
    });

    it("deberia asociar google_id si el correo ya existe sin google_id", async () => {
      (repo.obtenerPorGoogleId as jest.Mock).mockResolvedValue(null);
      const usuarioSinGoogle = { ...usuarioBase, google_id: null };
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(usuarioSinGoogle);
      (repo.asociarGoogleId as jest.Mock).mockResolvedValue(undefined);

      const result = await service.autenticarConGoogle(googleUser);

      expect(result.google_id).toBe("google-123");
      expect(repo.asociarGoogleId).toHaveBeenCalledWith(1, "google-123");
    });

    it("deberia fallar si el correo esta vinculado a otra cuenta de Google", async () => {
      (repo.obtenerPorGoogleId as jest.Mock).mockResolvedValue(null);
      const usuarioOtroGoogle = { ...usuarioBase, google_id: "google-otro" };
      (repo.buscarPorCorreo as jest.Mock).mockResolvedValue(usuarioOtroGoogle);

      await expect(service.autenticarConGoogle(googleUser)).rejects.toThrow(
        "El correo institucional ya está vinculado a otra cuenta de Google"
      );
    });

    it("deberia fallar si el usuario esta inactivo", async () => {
      const usuarioInactivo = { ...usuarioBase, estado: "INACTIVO" };
      (repo.obtenerPorGoogleId as jest.Mock).mockResolvedValue(usuarioInactivo);

      await expect(service.autenticarConGoogle(googleUser)).rejects.toThrow(
        "El usuario se encuentra inactivo"
      );
    });

    it("deberia fallar si falta providerId", async () => {
      await expect(
        service.autenticarConGoogle({ ...googleUser, providerId: "" })
      ).rejects.toThrow("Google no proporcionó un identificador de usuario");
    });

    it("deberia fallar si falta email", async () => {
      await expect(
        service.autenticarConGoogle({ ...googleUser, email: "" })
      ).rejects.toThrow("Google no proporcionó un correo electrónico");
    });

    it("deberia fallar si falta name", async () => {
      await expect(
        service.autenticarConGoogle({ ...googleUser, name: "" })
      ).rejects.toThrow("Google no proporcionó el nombre del usuario");
    });

    it("deberia fallar si el correo no es institucional", async () => {
      await expect(
        service.autenticarConGoogle({ ...googleUser, email: "juan@gmail.com" })
      ).rejects.toThrow("La cuenta de Google debe utilizar un correo institucional");
    });
  });
});
