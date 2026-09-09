jest.mock("./base.client", () => {
  const unaryMock = jest.fn().mockResolvedValue({ exito: true, mensaje: "ok" });
  class FakeGrpcBaseClient {
    unary = unaryMock;
    protected resolveService = jest.fn();
  }
  return { GrpcBaseClient: FakeGrpcBaseClient, ServiceConstructor: jest.fn() };
});

import { AuthGrpcClient } from "./auth.client";
import { InscripcionGrpcClient } from "./ins.client";
import { GrabacionesGrpcClient } from "./grab.client";
import { HistorialGrpcClient } from "./his.client";
import { NotificacionesGrpcClient } from "./not.client";
import { AnaliticaGrpcClient } from "./anal.client";
import { RecursosGrpcClient } from "./res.client";
import { GrpcBaseClient } from "./base.client";

const R = {} as any;

describe("AuthGrpcClient", () => {
  let c: AuthGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new AuthGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  test("registrarUsuario", async () => {
    await c.registrarUsuario(R);
    expect(unary).toHaveBeenCalledWith("RegistrarUsuario", R);
  });
  test("crearSesion", async () => {
    await c.crearSesion(R);
    expect(unary).toHaveBeenCalledWith("CrearSesion", R);
  });
  test("cerrarSesion", async () => {
    await c.cerrarSesion(R);
    expect(unary).toHaveBeenCalledWith("CerrarSesion", R);
  });
  test("validarSesion", async () => {
    await c.validarSesion(R);
    expect(unary).toHaveBeenCalledWith("ValidarSesion", R);
  });
  test("cambiarPassword", async () => {
    await c.cambiarPassword(R);
    expect(unary).toHaveBeenCalledWith("CambiarPassword", R);
  });
  test("consultarAuditLogs", async () => {
    await c.consultarAuditLogs(R);
    expect(unary).toHaveBeenCalledWith("ConsultarAuditLogs", R);
  });
  test("consultarUsuario", async () => {
    await c.consultarUsuario(R);
    expect(unary).toHaveBeenCalledWith("ConsultarUsuario", R);
  });
  test("consultarUsuarios", async () => {
    await c.consultarUsuarios(R);
    expect(unary).toHaveBeenCalledWith("ConsultarUsuarios", R);
  });
  test("iniciarOAuthGoogle", async () => {
    await c.iniciarOAuthGoogle(R);
    expect(unary).toHaveBeenCalledWith("IniciarOAuthGoogle", R);
  });
  test("autenticarConGoogle", async () => {
    await c.autenticarConGoogle(R);
    expect(unary).toHaveBeenCalledWith("AutenticarConGoogle", R);
  });
});

describe("InscripcionGrpcClient", () => {
  let c: InscripcionGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new InscripcionGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["crearArea", "CrearArea"],
    ["editarArea", "EditarArea"],
    ["eliminarArea", "EliminarArea"],
    ["consultarAreas", "ConsultarAreas"],
    ["crearCurso", "CrearCurso"],
    ["editarCurso", "EditarCurso"],
    ["eliminarCurso", "EliminarCurso"],
    ["consultarCursos", "ConsultarCursos"],
    ["crearPensum", "CrearPensum"],
    ["editarPensum", "EditarPensum"],
    ["eliminarPensum", "EliminarPensum"],
    ["consultarPensums", "ConsultarPensums"],
    ["crearCarrera", "CrearCarrera"],
    ["editarCarrera", "EditarCarrera"],
    ["eliminarCarrera", "EliminarCarrera"],
    ["consultarCarreras", "ConsultarCarreras"],
    ["crearPeriodo", "CrearPeriodo"],
    ["editarPeriodo", "EditarPeriodo"],
    ["eliminarPeriodo", "EliminarPeriodo"],
    ["consultarPeriodos", "ConsultarPeriodos"],
    ["crearPerfilAcademico", "CrearPerfilAcademico"],
    ["cambiarPerfilAcademico", "CambiarPerfilAcademico"],
    ["consultarPerfilAcademico", "ConsultarPerfilAcademico"],
    ["consultarPerfilesEstudiante", "ConsultarPerfilesEstudiante"],
    ["asignarRolUsuario", "AsignarRolUsuario"],
    ["cambiarRolUsuario", "CambiarRolUsuario"],
    ["eliminarRolUsuario", "EliminarRolUsuario"],
    ["comprobarRolUsuario", "ComprobarRolUsuario"],
    ["consultarRolesUsuario", "ConsultarRolesUsuario"],
    ["inscribirEstudiante", "InscribirEstudiante"],
    ["actualizarEstadoMatricula", "ActualizarEstadoMatricula"],
    ["consultarCursosEstudiante", "ConsultarCursosEstudiante"],
    ["consultarTodasInscripciones", "ConsultarTodasInscripciones"],
    ["consultarEstadosMatricula", "ConsultarEstadosMatricula"],
    ["consultarAuditLogs", "ConsultarAuditLogs"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("GrabacionesGrpcClient", () => {
  let c: GrabacionesGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new GrabacionesGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["consultarCatalogoClases", "ConsultarCatalogoClases"],
    ["crearUnidad", "CrearUnidad"],
    ["editarUnidad", "EditarUnidad"],
    ["eliminarUnidad", "EliminarUnidad"],
    ["consultarUnidades", "ConsultarUnidades"],
    ["crearTema", "CrearTema"],
    ["editarTema", "EditarTema"],
    ["eliminarTema", "EliminarTema"],
    ["consultarTemas", "ConsultarTemas"],
    ["crearClaseGrabada", "CrearClaseGrabada"],
    ["editarClaseGrabada", "EditarClaseGrabada"],
    ["eliminarClaseGrabada", "EliminarClaseGrabada"],
    ["busquedaAvanzada", "BusquedaAvanzada"],
    ["obtenerDetalleClaseGrabada", "ObtenerDetalleClaseGrabada"],
    ["obtenerEnlaceClaseGrabada", "ObtenerEnlaceClaseGrabada"],
    ["cargaMasivaClases", "CargaMasivaClases"],
    ["asignarDocente", "AsignarDocente"],
    ["asignarAuxiliar", "AsignarAuxiliar"],
    ["asignarMaterialApoyo", "AsignarMaterialApoyo"],
    ["asignarTemaClaseGrabada", "AsignarTemaClaseGrabada"],
    ["desasignarDocente", "DesasignarDocente"],
    ["desasignarAuxiliar", "DesasignarAuxiliar"],
    ["desasignarMaterialApoyo", "DesasignarMaterialApoyo"],
    ["desasignarTemaClaseGrabada", "DesasignarTemaClaseGrabada"],
    ["consultarParticipantesClase", "ConsultarParticipantesClase"],
    ["crearCapitulo", "CrearCapitulo"],
    ["editarCapitulo", "EditarCapitulo"],
    ["eliminarCapitulo", "EliminarCapitulo"],
    ["consultarCapitulosClase", "ConsultarCapitulosClase"],
    ["consultarAuditLogs", "ConsultarAuditLogs"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("HistorialGrpcClient", () => {
  let c: HistorialGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new HistorialGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["registrarProgreso", "RegistrarProgreso"],
    ["actualizarCheckpoint", "ActualizarCheckpoint"],
    ["marcarClaseCompletada", "MarcarClaseCompletada"],
    ["obtenerCheckpointClase", "ObtenerCheckpointClase"],
    ["consultarHistorialUsuario", "ConsultarHistorialUsuario"],
    ["consultarEstadisticasUsuario", "ConsultarEstadisticasUsuario"],
    ["eliminarHistorialClase", "EliminarHistorialClase"],
    ["consultarAuditLogs", "ConsultarAuditLogs"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("NotificacionesGrpcClient", () => {
  let c: NotificacionesGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new NotificacionesGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["enviarNotificacionRegistro", "EnviarNotificacionRegistro"],
    ["enviarNotificacionContenidoNuevo", "EnviarNotificacionContenidoNuevo"],
    ["enviarNotificacionAvisoGeneral", "EnviarNotificacionAvisoGeneral"],
    ["consultarNotificaciones", "ConsultarNotificaciones"],
    ["consultarAuditLogs", "ConsultarAuditLogs"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("AnaliticaGrpcClient", () => {
  let c: AnaliticaGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new AnaliticaGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["crearUnidad", "CrearUnidad"],
    ["editarUnidad", "EditarUnidad"],
    ["eliminarUnidad", "EliminarUnidad"],
    ["consultarUnidades", "ConsultarUnidades"],
    ["crearTema", "CrearTema"],
    ["editarTema", "EditarTema"],
    ["eliminarTema", "EliminarTema"],
    ["consultarTemas", "ConsultarTemas"],
    ["crearClaseGrabada", "CrearClaseGrabada"],
    ["editarClaseGrabada", "EditarClaseGrabada"],
    ["eliminarClaseGrabada", "EliminarClaseGrabada"],
    ["consultarCatalogoClases", "ConsultarCatalogoClases"],
    ["asignarTemaClaseGrabada", "AsignarTemaClaseGrabada"],
    ["desasignarTemaClaseGrabada", "DesasignarTemaClaseGrabada"],
    ["cargaMasivaClases", "CargaMasivaClases"],
    ["visualizarClase", "VisualizarClase"],
    ["calificarClase", "CalificarClase"],
    ["consultarCalificacionUsuario", "ConsultarCalificacionUsuario"],
    ["consultarClasesMasVistas", "ConsultarClasesMasVistas"],
    ["consultarTemasTendencia", "ConsultarTemasTendencia"],
    ["consultarRankingValoradas", "ConsultarRankingValoradas"],
    ["consultarAuditLogs", "ConsultarAuditLogs"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("RecursosGrpcClient", () => {
  let c: RecursosGrpcClient;
  let unary: jest.Mock;
  beforeEach(() => {
    c = new RecursosGrpcClient();
    unary = (c as any).unary as jest.Mock;
    unary.mockClear().mockResolvedValue({ exito: true });
  });
  const methods: [string, string][] = [
    ["crearRepositorio", "CrearRepositorio"],
    ["agregarArchivo", "AgregarArchivo"],
    ["actualizarVersionArchivo", "ActualizarVersionArchivo"],
    ["actualizarTag", "ActualizarTag"],
    ["eliminarArchivo", "EliminarArchivo"],
    ["consultarRepositorio", "ConsultarRepositorio"],
    ["consultarVersionesArchivo", "ConsultarVersionesArchivo"],
    ["consultarVersionArchivo", "ConsultarVersionArchivo"],
    ["consultarApunte", "ConsultarApunte"],
    ["crearApunte", "CrearApunte"],
    ["actualizarApunte", "ActualizarApunte"],
    ["agregarMarcadorTiempo", "AgregarMarcadorTiempo"],
    ["eliminarMarcadorTiempo", "EliminarMarcadorTiempo"],
  ];
  for (const [method, grpc] of methods) {
    test(method, async () => {
      await (c as any)[method](R);
      expect(unary).toHaveBeenCalledWith(grpc, R);
    });
  }
});

describe("resolveService default throws", () => {
  test("throws if not overridden in subclass", () => {
    const { GrpcBaseClient: RealBase } = jest.requireActual("./base.client") as any;
    expect(() => new RealBase("fake.proto", "localhost:0")).toThrow();
  });
});
