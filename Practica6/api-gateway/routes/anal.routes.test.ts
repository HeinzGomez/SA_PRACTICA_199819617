import { AnaliticaClient } from "../grpc/anal.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { AnalRoutes } from "./anal.routes";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<AnaliticaClient> = {
  crearUnidad: jest.fn(), editarUnidad: jest.fn(), eliminarUnidad: jest.fn(), consultarUnidades: jest.fn(),
  crearTema: jest.fn(), editarTema: jest.fn(), eliminarTema: jest.fn(), consultarTemas: jest.fn(),
  crearClaseGrabada: jest.fn(), editarClaseGrabada: jest.fn(), eliminarClaseGrabada: jest.fn(),
  consultarCatalogoClases: jest.fn(), asignarTemaClaseGrabada: jest.fn(), desasignarTemaClaseGrabada: jest.fn(),
  cargaMasivaClases: jest.fn(), visualizarClase: jest.fn(), calificarClase: jest.fn(),
  consultarCalificacionUsuario: jest.fn(), consultarClasesMasVistas: jest.fn(),
  consultarTemasTendencia: jest.fn(), consultarRankingValoradas: jest.fn(), consultarAuditLogs: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };
const U = { id_usuario: 1, nombre: "A", apellido: "B", correo_institucional: "a@b.com", estado: "", fecha_registro: "" };

function th(name: string, method: string, fn: (r: AnalRoutes) => (req: any, res: any) => Promise<void>, reqOpts: Record<string, unknown>, status = 200) {
  test(`${name} ok`, async () => {
    const r = new AnalRoutes(mc, amw, rmw);
    (mc[method as keyof AnaliticaClient] as any).mockResolvedValue(OK);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(status);
  });
  test(`${name} err`, async () => {
    const r = new AnalRoutes(mc, amw, rmw);
    (mc[method as keyof AnaliticaClient] as any).mockRejectedValue(gs);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
}

describe("AnalRoutes", () => {
  beforeEach(() => jest.clearAllMocks());

  th("crearUnidad", "crearUnidad", r => r.crearUnidad.bind(r), { body: { nombre: "U" } }, 201);
  th("editarUnidad", "editarUnidad", r => r.editarUnidad.bind(r), { body: { id_unidad: 1, nombre: "U" } });
  th("eliminarUnidad", "eliminarUnidad", r => r.eliminarUnidad.bind(r), { params: { id_unidad: "1" } });
  th("consultarUnidades", "consultarUnidades", r => r.consultarUnidades.bind(r), {});
  th("crearTema", "crearTema", r => r.crearTema.bind(r), { body: { id_unidad: 1, nombre: "T" } }, 201);
  th("editarTema", "editarTema", r => r.editarTema.bind(r), { body: { id_tema: 1, id_unidad: 1, nombre: "T" } });
  th("eliminarTema", "eliminarTema", r => r.eliminarTema.bind(r), { params: { id_tema: "1" } });
  th("consultarTemas", "consultarTemas", r => r.consultarTemas.bind(r), { query: { id_unidad: "1" } });
  th("crearClaseGrabada", "crearClaseGrabada", r => r.crearClaseGrabada.bind(r), { body: { id_curso: 1, id_periodo: 1, id_area: 1, titulo: "T", duracion_min: 60, anio: 2025, num_semestre: 1 } }, 201);
  th("editarClaseGrabada", "editarClaseGrabada", r => r.editarClaseGrabada.bind(r), { body: { id_clase: 1, id_curso: 1, id_periodo: 1, id_area: 1, titulo: "T", duracion_min: 60, anio: 2025, num_semestre: 1 } });
  th("eliminarClaseGrabada", "eliminarClaseGrabada", r => r.eliminarClaseGrabada.bind(r), { params: { id_clase: "1" } });
  th("consultarCatalogoClases", "consultarCatalogoClases", r => r.consultarCatalogoClases.bind(r), {});
  th("asignarTemaClaseGrabada", "asignarTemaClaseGrabada", r => r.asignarTemaClaseGrabada.bind(r), { body: { id_clase: 1, id_tema: 1 } });
  th("desasignarTemaClaseGrabada", "desasignarTemaClaseGrabada", r => r.desasignarTemaClaseGrabada.bind(r), { params: { id_clase: "1", id_tema: "2" } });
  th("cargaMasivaClases", "cargaMasivaClases", r => r.cargaMasivaClases.bind(r), { body: [] });
  th("visualizarClase", "visualizarClase", r => r.visualizarClase.bind(r), { body: { id_clase: 1 }, usuario: U });
  th("calificarClase", "calificarClase", r => r.calificarClase.bind(r), { body: { id_clase: 1, puntuacion: 5 }, usuario: U });
  th("consultarCalificacionUsuario", "consultarCalificacionUsuario", r => r.consultarCalificacionUsuario.bind(r), { params: { id_clase: "1" }, usuario: U });
  th("consultarClasesMasVistas", "consultarClasesMasVistas", r => r.consultarClasesMasVistas.bind(r), { query: { fecha_inicio: "2025-01-01", fecha_fin: "2025-12-31" } });
  th("consultarTemasTendencia", "consultarTemasTendencia", r => r.consultarTemasTendencia.bind(r), { query: { fecha_inicio: "2025-01-01", fecha_fin: "2025-12-31" } });
  th("consultarRankingValoradas", "consultarRankingValoradas", r => r.consultarRankingValoradas.bind(r), { query: { limite: "10" } });
  th("consultarAuditLogs", "consultarAuditLogs", r => r.consultarAuditLogs.bind(r), { query: { pagina: "1" } });

  test("consultarCalificacionUsuario sin usuario → 401", async () => {
    const r = new AnalRoutes(mc, amw, rmw);
    const res = mockRes(); await r.consultarCalificacionUsuario(R({ params: { id_clase: "1" } }) as any, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
