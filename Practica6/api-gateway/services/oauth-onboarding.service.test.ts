import { InscripcionClient } from "../grpc/ins.client";
import { NotificacionesClient } from "../grpc/not.client";
import { OAuthOnboardingServiceImp } from "./oauth-onboarding.service";

const mockInsClient: jest.Mocked<InscripcionClient> = {
  comprobarRolUsuario: jest.fn(),
  asignarRolUsuario: jest.fn(),
  consultarPerfilAcademico: jest.fn(),
  crearPerfilAcademico: jest.fn(),
  crearArea: jest.fn(), editarArea: jest.fn(), eliminarArea: jest.fn(), consultarAreas: jest.fn(),
  crearCurso: jest.fn(), editarCurso: jest.fn(), eliminarCurso: jest.fn(), consultarCursos: jest.fn(),
  crearPensum: jest.fn(), editarPensum: jest.fn(), eliminarPensum: jest.fn(), consultarPensums: jest.fn(),
  crearCarrera: jest.fn(), editarCarrera: jest.fn(), eliminarCarrera: jest.fn(), consultarCarreras: jest.fn(),
  crearPeriodo: jest.fn(), editarPeriodo: jest.fn(), eliminarPeriodo: jest.fn(), consultarPeriodos: jest.fn(),
  cambiarPerfilAcademico: jest.fn(), consultarPerfilesEstudiante: jest.fn(),
  cambiarRolUsuario: jest.fn(), eliminarRolUsuario: jest.fn(), consultarRolesUsuario: jest.fn(),
  inscribirEstudiante: jest.fn(), actualizarEstadoMatricula: jest.fn(),
  consultarCursosEstudiante: jest.fn(), consultarTodasInscripciones: jest.fn(),
  consultarEstadosMatricula: jest.fn(), consultarAuditLogs: jest.fn(),
};

const mockNotClient: jest.Mocked<NotificacionesClient> = {
  enviarNotificacionRegistro: jest.fn(),
  enviarNotificacionContenidoNuevo: jest.fn(),
  enviarNotificacionAvisoGeneral: jest.fn(),
  consultarNotificaciones: jest.fn(),
  consultarAuditLogs: jest.fn(),
};

const testUsuario = {
  id_usuario: 1,
  nombre: "Juan",
  apellido: "Perez",
  correo_institucional: "juan@correo.com",
  estado: "ACTIVO",
  fecha_registro: "2025-01-01",
};

const perfilCompleto = { id_perfil: 1, id_usuario: 1, registro_academico: "", dpi: "", fecha_nacimiento: "", telefono: "", id_carrera: 0, direccion: "" };

describe("OAuthOnboardingService", () => {
  let service: OAuthOnboardingServiceImp;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OAuthOnboardingServiceImp(mockInsClient, mockNotClient);
  });

  test("perfil existente → retorna false", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(false);
  });

  test("sin rol y sin perfil → crea ambos, retorna true", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: false });
    mockInsClient.asignarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok" });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    mockNotClient.enviarNotificacionRegistro.mockResolvedValue({ exito: true, mensaje: "ok" });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(true);
    expect(mockInsClient.asignarRolUsuario).toHaveBeenCalled();
    expect(mockNotClient.enviarNotificacionRegistro).toHaveBeenCalled();
  });

  test("con rol existente pero sin perfil → crea perfil, retorna true", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    mockNotClient.enviarNotificacionRegistro.mockResolvedValue({ exito: true, mensaje: "ok" });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(true);
    expect(mockInsClient.asignarRolUsuario).not.toHaveBeenCalled();
  });

  test("crear perfil falla → retorna false", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: false, mensaje: "error", perfil: undefined });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(false);
  });

  test("sin notClient → no lanza error", async () => {
    const svc = new OAuthOnboardingServiceImp(mockInsClient);
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    const result = await svc.asegurarEstudiante(testUsuario);
    expect(result).toBe(true);
  });

  test("notClient con exito false → no lanza error", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    mockNotClient.enviarNotificacionRegistro.mockResolvedValue({ exito: false, mensaje: "fail" });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(true);
  });

  test("notClient lanza error → no lanza error", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: true, mensaje: "ok", tiene_rol: true });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: undefined });
    mockInsClient.crearPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    mockNotClient.enviarNotificacionRegistro.mockRejectedValue(new Error("network"));
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(true);
  });

  test("comprobarRolUsuario falla → no lanza error", async () => {
    mockInsClient.comprobarRolUsuario.mockResolvedValue({ exito: false, mensaje: "fail", tiene_rol: false });
    mockInsClient.consultarPerfilAcademico.mockResolvedValue({ exito: true, mensaje: "ok", perfil: perfilCompleto });
    const result = await service.asegurarEstudiante(testUsuario);
    expect(result).toBe(false);
  });
});
