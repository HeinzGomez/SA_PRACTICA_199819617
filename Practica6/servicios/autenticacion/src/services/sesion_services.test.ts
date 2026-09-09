import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SesionServiceImp } from "./sesion_services";
import { SesionRepository } from "../repositories/sesion_repository";
import { UserRepository } from "../repositories/user_repository";
import { SesionRow } from "../types/sesion.types";
import { UsuarioRow } from "../types/user.types";

jest.mock("jsonwebtoken");
const mockedJwt = jest.mocked(jwt);

function mockSesionRepository(overrides: Partial<SesionRepository> = {}): SesionRepository {
  return {
    crear: jest.fn(),
    cerrar: jest.fn(),
    validar: jest.fn(),
    buscarPorId: jest.fn(),
    ...overrides,
  };
}

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

const sesionBase: SesionRow = {
  id_sesion: 1,
  id_usuario: 1,
  token_hash: "abc123",
  fecha_creacion: new Date("2025-01-01"),
  fecha_expiracion: new Date("2025-01-02"),
  estado: "ACTIVA",
};

const usuarioBase: UsuarioRow = {
  id_usuario: 1,
  nombre: "Juan",
  apellido: "Perez",
  correo_institucional: "juan@ingenieria.usac.edu.gt",
  password_hash: null,
  google_id: null,
  estado: "ACTIVO",
  fecha_registro: new Date("2025-01-01"),
};

describe("SesionServiceImp", () => {
  let service: SesionServiceImp;
  let sesionRepo: SesionRepository;
  let userRepo: UserRepository;

  beforeEach(() => {
    sesionRepo = mockSesionRepository();
    userRepo = mockUserRepository();
    service = new SesionServiceImp(sesionRepo, userRepo);
    jest.clearAllMocks();
  });

  describe("crearSesion", () => {
    it("deberia crear una sesion con access y refresh tokens", async () => {
      (sesionRepo.crear as jest.Mock).mockResolvedValue(sesionBase);
      mockedJwt.sign.mockReturnValue("mock-jwt-token" as never);

      const result = await service.crearSesion(1);

      expect(result.accessToken).toBe("mock-jwt-token");
      expect(typeof result.refreshToken).toBe("string");
      expect(result.refreshToken).toHaveLength(64);
      expect(result.sesion).toEqual(sesionBase);
      expect(sesionRepo.crear).toHaveBeenCalled();
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { id_sesion: 1, id_usuario: 1 },
        expect.any(String),
        { expiresIn: expect.stringContaining("m") }
      );
    });
  });

  describe("cerrarSesion", () => {
    it("deberia cerrar la sesion", async () => {
      (sesionRepo.cerrar as jest.Mock).mockResolvedValue(undefined);
      await service.cerrarSesion(1);
      expect(sesionRepo.cerrar).toHaveBeenCalledWith(1);
    });

    it("deberia fallar si el id es 0", async () => {
      await expect(service.cerrarSesion(0)).rejects.toThrow(
        "El id de la sesión es obligatorio"
      );
    });
  });

  describe("validarSesion", () => {
    it("deberia validar una sesion con token valido", async () => {
      mockedJwt.verify.mockReturnValue({ id_sesion: 1, id_usuario: 1 } as never);
      (sesionRepo.validar as jest.Mock).mockResolvedValue(true);
      (sesionRepo.buscarPorId as jest.Mock).mockResolvedValue(sesionBase);
      (userRepo.buscarPorId as jest.Mock).mockResolvedValue(usuarioBase);

      const result = await service.validarSesion("valid-token");

      expect(result.sesion).toEqual(sesionBase);
      expect(result.usuario).toEqual(usuarioBase);
    });

    it("deberia fallar si el token esta vacio", async () => {
      await expect(service.validarSesion("")).rejects.toThrow(
        "El token de acceso es obligatorio"
      );
    });

    it("deberia fallar si el token es invalido", async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error("jwt malformed");
      });

      await expect(service.validarSesion("bad-token")).rejects.toThrow(
        "Token de acceso inválido o expirado"
      );
    });

    it("deberia fallar si la sesion no es valida", async () => {
      mockedJwt.verify.mockReturnValue({ id_sesion: 1, id_usuario: 1 } as never);
      (sesionRepo.validar as jest.Mock).mockResolvedValue(false);

      await expect(service.validarSesion("valid-token")).rejects.toThrow(
        "La sesión no es válida o ha expirado"
      );
    });

    it("deberia fallar si la sesion no existe", async () => {
      mockedJwt.verify.mockReturnValue({ id_sesion: 1, id_usuario: 1 } as never);
      (sesionRepo.validar as jest.Mock).mockResolvedValue(true);
      (sesionRepo.buscarPorId as jest.Mock).mockResolvedValue(null);

      await expect(service.validarSesion("valid-token")).rejects.toThrow(
        "La sesión no existe"
      );
    });

    it("deberia fallar si el usuario no existe", async () => {
      mockedJwt.verify.mockReturnValue({ id_sesion: 1, id_usuario: 1 } as never);
      (sesionRepo.validar as jest.Mock).mockResolvedValue(true);
      (sesionRepo.buscarPorId as jest.Mock).mockResolvedValue(sesionBase);
      (userRepo.buscarPorId as jest.Mock).mockResolvedValue(null);

      await expect(service.validarSesion("valid-token")).rejects.toThrow(
        "El usuario de la sesión no existe"
      );
    });
  });
});
