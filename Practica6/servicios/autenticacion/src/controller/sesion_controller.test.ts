import { status } from "@grpc/grpc-js";
import { SesionController } from "./sesion_controller";
import { UserService } from "../services/user_services";
import { SesionService } from "../services/sesion_services";
import { UsuarioRow } from "../types/user.types";
import { SesionRow } from "../types/sesion.types";

function mockUserService(overrides: Partial<UserService> = {}): UserService {
  return {
    registrarUsuario: jest.fn(),
    verificarCredenciales: jest.fn(),
    cambiarPassword: jest.fn(),
    obtenerUsuario: jest.fn(),
    listarUsuarios: jest.fn(),
    autenticarConGoogle: jest.fn(),
    ...overrides,
  };
}

function mockSesionService(overrides: Partial<SesionService> = {}): SesionService {
  return {
    crearSesion: jest.fn(),
    cerrarSesion: jest.fn(),
    validarSesion: jest.fn(),
    ...overrides,
  };
}

function createMockCall(request: any) {
  return { request } as any;
}

function createMockCallback() {
  return jest.fn();
}

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

const sesionBase: SesionRow = {
  id_sesion: 1,
  id_usuario: 1,
  token_hash: "abc",
  fecha_creacion: new Date("2025-01-01"),
  fecha_expiracion: new Date("2025-01-02"),
  estado: "ACTIVA",
};

describe("SesionController", () => {
  let controller: SesionController;
  let userService: UserService;
  let sesionService: SesionService;

  beforeEach(() => {
    userService = mockUserService();
    sesionService = mockSesionService();
    controller = new SesionController(userService, sesionService);
    jest.clearAllMocks();
  });

  function expectError(callback: jest.Mock, expectedCode: number) {
    expect(callback).toHaveBeenCalledTimes(1);
    const err = callback.mock.calls[0][0];
    expect(err).not.toBeNull();
    expect(err.code).toBe(expectedCode);
  }

  function expectSuccess(callback: jest.Mock, expectedData?: any) {
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeNull();
    if (expectedData) {
      expect(callback.mock.calls[0][1]).toMatchObject(expectedData);
    }
  }

  describe("crearSesion", () => {
    it("deberia crear una sesion exitosamente", async () => {
      (userService.verificarCredenciales as jest.Mock).mockResolvedValue(usuarioBase);
      (sesionService.crearSesion as jest.Mock).mockResolvedValue({
        accessToken: "jwt-token",
        refreshToken: "refresh-token",
        sesion: sesionBase,
      });
      const callback = createMockCallback();

      await controller.crearSesion(
        createMockCall({ correo: "juan@ingenieria.usac.edu.gt", password: "12345678" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        access_token: "jwt-token",
        refresh_token: "refresh-token",
      });
    });

    it("deberia fallar si las credenciales son invalidas", async () => {
      (userService.verificarCredenciales as jest.Mock).mockResolvedValue(null);
      const callback = createMockCallback();

      await controller.crearSesion(
        createMockCall({ correo: "bad@ingenieria.usac.edu.gt", password: "wrong" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });

    it("deberia manejar errores inesperados", async () => {
      (userService.verificarCredenciales as jest.Mock).mockRejectedValue("string error");
      const callback = createMockCallback();

      await controller.crearSesion(
        createMockCall({ correo: "x@ingenieria.usac.edu.gt", password: "123" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });
  });

  describe("cerrarSesion", () => {
    it("deberia cerrar la sesion", async () => {
      (sesionService.cerrarSesion as jest.Mock).mockResolvedValue(undefined);
      const callback = createMockCallback();

      await controller.cerrarSesion(
        createMockCall({ id_sesion: 1 }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "Sesión cerrada exitosamente",
      });
    });

    it("deberia manejar errores", async () => {
      (sesionService.cerrarSesion as jest.Mock).mockRejectedValue(new Error("Sesion no encontrada"));
      const callback = createMockCallback();

      await controller.cerrarSesion(
        createMockCall({ id_sesion: 999 }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });
  });

  describe("validarSesion", () => {
    it("deberia validar la sesion", async () => {
      (sesionService.validarSesion as jest.Mock).mockResolvedValue({
        sesion: sesionBase,
        usuario: usuarioBase,
      });
      const callback = createMockCallback();

      await controller.validarSesion(
        createMockCall({ access_token: "valid-token" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "Sesión válida",
      });
    });

    it("deberia fallar si la sesion no es valida", async () => {
      (sesionService.validarSesion as jest.Mock).mockRejectedValue(
        new Error("Token de acceso invalido o expirado")
      );
      const callback = createMockCallback();

      await controller.validarSesion(
        createMockCall({ access_token: "bad-token" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });
  });
});
