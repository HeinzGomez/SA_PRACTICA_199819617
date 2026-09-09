import { GrabacionesClient } from "../grpc/grab.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { GrabRoutes } from "./grab.routes";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<GrabacionesClient> = {
  consultarCatalogoClases: jest.fn(), busquedaAvanzada: jest.fn(), obtenerDetalleClaseGrabada: jest.fn(),
  obtenerEnlaceClaseGrabada: jest.fn(), consultarParticipantesClase: jest.fn(),
  crearClaseGrabada: jest.fn(), editarClaseGrabada: jest.fn(), eliminarClaseGrabada: jest.fn(),
  asignarDocente: jest.fn(), desasignarDocente: jest.fn(), asignarAuxiliar: jest.fn(), desasignarAuxiliar: jest.fn(),
  asignarMaterialApoyo: jest.fn(), desasignarMaterialApoyo: jest.fn(),
  asignarTemaClaseGrabada: jest.fn(), desasignarTemaClaseGrabada: jest.fn(),
  cargaMasivaClases: jest.fn(), consultarUnidades: jest.fn(), crearUnidad: jest.fn(), editarUnidad: jest.fn(), eliminarUnidad: jest.fn(),
  consultarTemas: jest.fn(), crearTema: jest.fn(), editarTema: jest.fn(), eliminarTema: jest.fn(),
  consultarCapitulosClase: jest.fn(), crearCapitulo: jest.fn(), editarCapitulo: jest.fn(), eliminarCapitulo: jest.fn(),
  consultarPlaylistsUsuario: jest.fn(), consultarPlaylistPorHash: jest.fn(),
  consultarVideosPlaylist: jest.fn(), consultarVideosPlaylistPorHash: jest.fn(),
  crearPlaylist: jest.fn(), eliminarPlaylist: jest.fn(), cambiarVisibilidadPlaylist: jest.fn(),
  agregarVideoPlaylist: jest.fn(), eliminarVideoPlaylist: jest.fn(), generarLinkPlaylist: jest.fn(),
  consultarAuditLogs: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };

function th(name: string, method: string, fn: (r: GrabRoutes) => (req: any, res: any) => Promise<void>, reqOpts: Record<string, unknown>, status = 200) {
  test(`${name} ok`, async () => {
    const r = new GrabRoutes(mc, amw, rmw);
    (mc[method as keyof GrabacionesClient] as any).mockResolvedValue(OK);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(status);
  });
  test(`${name} err`, async () => {
    const r = new GrabRoutes(mc, amw, rmw);
    (mc[method as keyof GrabacionesClient] as any).mockRejectedValue(gs);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
}

describe("GrabRoutes", () => {
  beforeEach(() => jest.clearAllMocks());

  th("catalogoClases", "consultarCatalogoClases", r => r.catalogoClases.bind(r), { query: { pagina: "1" } });
  th("busquedaAvanzada", "busquedaAvanzada", r => r.busquedaAvanzada.bind(r), { query: { anio: "2025" } });
  th("detalleClase", "obtenerDetalleClaseGrabada", r => r.detalleClase.bind(r), { params: { id: "1" } });
  th("enlaceClase", "obtenerEnlaceClaseGrabada", r => r.enlaceClase.bind(r), { params: { id: "1" } });
  th("participantesClase", "consultarParticipantesClase", r => r.participantesClase.bind(r), { params: { id: "1" } });
  th("crearClase", "crearClaseGrabada", r => r.crearClase.bind(r), { body: { id_curso: 1, id_periodo: 1, id_area: 1, titulo: "T", fecha_impartida: "2025-01-01", duracion_min: 60, anio: 2025, num_semestre: 1 } }, 201);
  th("editarClase", "editarClaseGrabada", r => r.editarClase.bind(r), { params: { id: "1" }, body: { id_curso: 1, id_periodo: 1, id_area: 1, titulo: "T", fecha_impartida: "2025-01-01", duracion_min: 60, anio: 2025, num_semestre: 1 } });
  th("eliminarClase", "eliminarClaseGrabada", r => r.eliminarClase.bind(r), { params: { id: "1" } });
  th("asignarDocente", "asignarDocente", r => r.asignarDocente.bind(r), { params: { id: "1" }, body: { id_usuario: 1 } });
  th("desasignarDocente", "desasignarDocente", r => r.desasignarDocente.bind(r), { params: { id: "1", id_usuario: "2" } });
  th("asignarAuxiliar", "asignarAuxiliar", r => r.asignarAuxiliar.bind(r), { params: { id: "1" }, body: { id_usuario: 1 } });
  th("desasignarAuxiliar", "desasignarAuxiliar", r => r.desasignarAuxiliar.bind(r), { params: { id: "1", id_usuario: "2" } });
  th("asignarMaterial", "asignarMaterialApoyo", r => r.asignarMaterial.bind(r), { params: { id: "1" }, body: { nombre: "M" } }, 201);
  th("desasignarMaterial", "desasignarMaterialApoyo", r => r.desasignarMaterial.bind(r), { params: { id_material: "1" } });
  th("asignarTema", "asignarTemaClaseGrabada", r => r.asignarTema.bind(r), { params: { id: "1" }, body: { id_tema: 1 } });
  th("desasignarTema", "desasignarTemaClaseGrabada", r => r.desasignarTema.bind(r), { params: { id: "1", id_tema: "2" } });
  th("cargaMasivaClases", "cargaMasivaClases", r => r.cargaMasivaClases.bind(r), { body: [] });
  th("unidades", "consultarUnidades", r => r.unidades.bind(r), {});
  th("crearUnidad", "crearUnidad", r => r.crearUnidad.bind(r), { body: { nombre: "U" } }, 201);
  th("editarUnidad", "editarUnidad", r => r.editarUnidad.bind(r), { params: { id: "1" }, body: { nombre: "U" } });
  th("eliminarUnidad", "eliminarUnidad", r => r.eliminarUnidad.bind(r), { params: { id: "1" } });
  th("temas", "consultarTemas", r => r.temas.bind(r), { query: { id_unidad: "1" } });
  th("crearTema", "crearTema", r => r.crearTema.bind(r), { body: { id_unidad: 1, nombre: "T" } }, 201);
  th("editarTema", "editarTema", r => r.editarTema.bind(r), { params: { id: "1" }, body: { id_unidad: 1, nombre: "T" } });
  th("eliminarTema", "eliminarTema", r => r.eliminarTema.bind(r), { params: { id: "1" } });
  th("consultarCapitulos", "consultarCapitulosClase", r => r.consultarCapitulos.bind(r), { params: { id: "1" } });
  th("crearCapitulo", "crearCapitulo", r => r.crearCapitulo.bind(r), { params: { id: "1" }, body: { titulo: "C", tiempo_inicio: 0 } }, 201);
  th("editarCapitulo", "editarCapitulo", r => r.editarCapitulo.bind(r), { params: { id_capitulo: "1" }, body: { titulo: "C", tiempo_inicio: 0 } });
  th("eliminarCapitulo", "eliminarCapitulo", r => r.eliminarCapitulo.bind(r), { params: { id_capitulo: "1" } });
  th("consultarAudit", "consultarAuditLogs", r => r.consultarAudit.bind(r), { query: { pagina: "1" } });
});
