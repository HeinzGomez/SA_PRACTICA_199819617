import { status } from "@grpc/grpc-js";
import { UserController } from "./user_controller";
import { UserService } from "../services/user_services";
import { GoogleOAuthService } from "../services/google-oauth_service";
import { OAuthStateService } from "../services/oauth-state_service";
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

function mockGoogleOAuthService(overrides: Partial<GoogleOAuthService> = {}): GoogleOAuthService {
  return {
    generarAuthorizationUrl: jest.fn(),
    obtenerTokens: jest.fn(),
    obtenerUsuario: jest.fn(),
    ...overrides,
  };
}

function mockOAuthStateService(overrides: Partial<OAuthStateService> = {}): OAuthStateService {
  return {
    generarState: jest.fn(),
    validarState: jest.fn(),
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

describe("UserController", () => {
  let controller: UserController;
  let userService: UserService;
  let googleOAuthService: GoogleOAuthService;
  let oauthStateService: OAuthStateService;
  let sesionService: SesionService;

  beforeEach(() => {
    userService = mockUserService();
    googleOAuthService = mockGoogleOAuthService();
    oauthStateService = mockOAuthStateService();
    sesionService = mockSesionService();
    controller = new UserController(
      userService,
      googleOAuthService,
      oauthStateService,
      sesionService
    );
    jest.clearAllMocks();
  });

  function expectError(callback: jest.Mock, expectedCode: number, expectedMsg?: string) {
    expect(callback).toHaveBeenCalledTimes(1);
    const err = callback.mock.calls[0][0];
    expect(err).not.toBeNull();
    expect(err.code).toBe(expectedCode);
    if (expectedMsg) {
      expect(err.message).toContain(expectedMsg);
    }
  }

  function expectSuccess(callback: jest.Mock, expectedData?: any) {
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeNull();
    if (expectedData) {
      expect(callback.mock.calls[0][1]).toMatchObject(expectedData);
    }
  }

  // ─── registrarUsuario ──────────────────────────────────

  describe("registrarUsuario", () => {
    it("deberia registrar y retornar el usuario", async () => {
      (userService.registrarUsuario as jest.Mock).mockResolvedValue(usuarioBase);
      const callback = createMockCallback();

      await controller.registrarUsuario(
        createMockCall({ nombre: "Juan", apellido: "Perez", correo: "juan@ingenieria.usac.edu.gt", password: "12345678" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "Usuario registrado exitosamente",
      });
      expect(callback.mock.calls[0][1].usuario.id_usuario).toBe(1);
    });

    it("deberia retornar error si el service lanza excepcion", async () => {
      (userService.registrarUsuario as jest.Mock).mockRejectedValue(new Error("Correo duplicado"));
      const callback = createMockCallback();

      await controller.registrarUsuario(
        createMockCall({ nombre: "Juan", apellido: "Perez", correo: "x@ingenieria.usac.edu.gt", password: "12345678" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT, "Correo duplicado");
    });
  });

  // ─── cambiarPassword ───────────────────────────────────

  describe("cambiarPassword", () => {
    it("deberia cambiar password exitosamente", async () => {
      (userService.cambiarPassword as jest.Mock).mockResolvedValue(undefined);
      const callback = createMockCallback();

      await controller.cambiarPassword(
        createMockCall({ id_usuario: 1, password_actual: "old", password_nueva: "new12345" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "Contraseña actualizada exitosamente",
      });
    });

    it("deberia retornar error si falla", async () => {
      (userService.cambiarPassword as jest.Mock).mockRejectedValue(new Error("Contrasena incorrecta"));
      const callback = createMockCallback();

      await controller.cambiarPassword(
        createMockCall({ id_usuario: 1, password_actual: "wrong", password_nueva: "new12345" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT);
    });
  });

  // ─── consultarUsuario ──────────────────────────────────

  describe("consultarUsuario", () => {
    it("deberia retornar el usuario", async () => {
      (userService.obtenerUsuario as jest.Mock).mockResolvedValue(usuarioBase);
      const callback = createMockCallback();

      await controller.consultarUsuario(
        createMockCall({ id_usuario: 1 }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "Usuario consultado exitosamente",
      });
    });

    it("deberia retornar NOT_FOUND si no existe", async () => {
      (userService.obtenerUsuario as jest.Mock).mockResolvedValue(null);
      const callback = createMockCallback();

      await controller.consultarUsuario(
        createMockCall({ id_usuario: 999 }),
        callback
      );

      expectError(callback, status.NOT_FOUND, "El usuario no existe");
    });

    it("deberia manejar errores inesperados", async () => {
      (userService.obtenerUsuario as jest.Mock).mockRejectedValue("string error");
      const callback = createMockCallback();

      await controller.consultarUsuario(
        createMockCall({ id_usuario: 1 }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT, "Error interno del servidor");
    });
  });

  // ─── consultarUsuarios ─────────────────────────────────

  describe("consultarUsuarios", () => {
    it("deberia retornar la lista de usuarios", async () => {
      (userService.listarUsuarios as jest.Mock).mockResolvedValue([usuarioBase]);
      const callback = createMockCallback();

      await controller.consultarUsuarios(createMockCall({}), callback);

      expectSuccess(callback, {
        exito: true,
        mensaje: "Usuarios consultados exitosamente",
      });
      expect(callback.mock.calls[0][1].usuarios).toHaveLength(1);
    });

    it("deberia manejar errores", async () => {
      (userService.listarUsuarios as jest.Mock).mockRejectedValue(new Error("DB error"));
      const callback = createMockCallback();

      await controller.consultarUsuarios(createMockCall({}), callback);

      expectError(callback, status.INVALID_ARGUMENT);
    });
  });

  // ─── iniciarOAuthGoogle ────────────────────────────────

  describe("iniciarOAuthGoogle", () => {
    it("deberia generar la URL de autorizacion", async () => {
      (oauthStateService.generarState as jest.Mock).mockReturnValue("mock-state");
      (googleOAuthService.generarAuthorizationUrl as jest.Mock).mockReturnValue("https://accounts.google.com/o/oauth2/auth?...");
      const callback = createMockCallback();

      await controller.iniciarOAuthGoogle(
        createMockCall({}),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        mensaje: "URL de autorización generada exitosamente",
      });
      expect(callback.mock.calls[0][1].authorization_url).toContain("https://");
    });

    it("deberia usar el state del request si se provee", async () => {
      (googleOAuthService.generarAuthorizationUrl as jest.Mock).mockReturnValue("https://url");
      const callback = createMockCallback();

      await controller.iniciarOAuthGoogle(
        createMockCall({ state: "provided-state" }),
        callback
      );

      expect(oauthStateService.generarState).not.toHaveBeenCalled();
      expect(googleOAuthService.generarAuthorizationUrl).toHaveBeenCalledWith("provided-state");
    });

    it("deberia manejar errores", async () => {
      (oauthStateService.generarState as jest.Mock).mockImplementation(() => { throw new Error("fail"); });
      const callback = createMockCallback();

      await controller.iniciarOAuthGoogle(createMockCall({}), callback);

      expectError(callback, status.INTERNAL);
    });
  });

  // ─── autenticarConGoogle ───────────────────────────────

  describe("autenticarConGoogle", () => {
    it("deberia autenticar exitosamente con Google", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(true);
      (googleOAuthService.obtenerTokens as jest.Mock).mockResolvedValue({ accessToken: "at" });
      (googleOAuthService.obtenerUsuario as jest.Mock).mockResolvedValue({
        providerId: "g1", email: "juan@ingenieria.usac.edu.gt", name: "Juan",
      });
      (userService.autenticarConGoogle as jest.Mock).mockResolvedValue(usuarioBase);
      (sesionService.crearSesion as jest.Mock).mockResolvedValue({
        accessToken: "jwt", refreshToken: "rt", sesion: sesionBase,
      });
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "auth-code", state: "valid-state" }),
        callback
      );

      expectSuccess(callback, {
        exito: true,
        access_token: "jwt",
        refresh_token: "rt",
      });
    });

    it("deberia fallar si falta el code", async () => {
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "", state: "state" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT, "código");
    });

    it("deberia fallar si falta el state", async () => {
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "" }),
        callback
      );

      expectError(callback, status.INVALID_ARGUMENT, "state");
    });

    it("deberia fallar si el state no es valido", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(false);
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "bad-state" }),
        callback
      );

      expectError(callback, status.UNAUTHENTICATED);
    });

    it("deberia manejar error de google OAuth (codigo interno)", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(true);
      (googleOAuthService.obtenerTokens as jest.Mock).mockRejectedValue(new Error("token exchange failed"));
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "state" }),
        callback
      );

      expectError(callback, status.INTERNAL);
    });

    it("deberia mapear error de correo a PERMISSION_DENIED", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(true);
      (googleOAuthService.obtenerTokens as jest.Mock).mockResolvedValue({ accessToken: "at" });
      (googleOAuthService.obtenerUsuario as jest.Mock).mockResolvedValue({
        providerId: "g1", email: "juan@gmail.com", name: "Juan",
      });
      (userService.autenticarConGoogle as jest.Mock).mockRejectedValue(
        new Error("El correo debe pertenecer al dominio institucional")
      );
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "state" }),
        callback
      );

      expectError(callback, status.PERMISSION_DENIED);
    });

    it("deberia mapear error de usuario inactivo a PERMISSION_DENIED", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(true);
      (googleOAuthService.obtenerTokens as jest.Mock).mockResolvedValue({ accessToken: "at" });
      (googleOAuthService.obtenerUsuario as jest.Mock).mockResolvedValue({
        providerId: "g1", email: "juan@ingenieria.usac.edu.gt", name: "Juan",
      });
      (userService.autenticarConGoogle as jest.Mock).mockRejectedValue(
        new Error("El usuario se encuentra inactivo")
      );
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "state" }),
        callback
      );

      expectError(callback, status.PERMISSION_DENIED);
    });

    it("deberia manejar error no-Error como INTERNAL", async () => {
      (oauthStateService.validarState as jest.Mock).mockReturnValue(true);
      (googleOAuthService.obtenerTokens as jest.Mock).mockRejectedValue("string error");
      const callback = createMockCallback();

      await controller.autenticarConGoogle(
        createMockCall({ code: "code", state: "state" }),
        callback
      );

      expectError(callback, status.INTERNAL);
    });
  });
});
