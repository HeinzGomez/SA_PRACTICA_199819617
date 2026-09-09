import { RecursosClient } from "../grpc/res.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { ResRoutes } from "./res.routes";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<RecursosClient> = {
  crearRepositorio: jest.fn(), agregarArchivo: jest.fn(), actualizarVersionArchivo: jest.fn(),
  actualizarTag: jest.fn(), eliminarArchivo: jest.fn(), consultarRepositorio: jest.fn(),
  consultarVersionesArchivo: jest.fn(), consultarVersionArchivo: jest.fn(),
  consultarApunte: jest.fn(), crearApunte: jest.fn(), actualizarApunte: jest.fn(),
  agregarMarcadorTiempo: jest.fn(), eliminarMarcadorTiempo: jest.fn(),
  consultarDudasClase: jest.fn(), crearDuda: jest.fn(), crearRespuesta: jest.fn(),
  marcarRespuesta: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };

function th(name: string, method: string, fn: (r: ResRoutes) => (req: any, res: any) => Promise<void>, reqOpts: Record<string, unknown>, status = 200) {
  test(`${name} ok`, async () => {
    const r = new ResRoutes(mc, amw, rmw);
    (mc[method as keyof RecursosClient] as any).mockResolvedValue(OK);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(status);
  });
  test(`${name} err`, async () => {
    const r = new ResRoutes(mc, amw, rmw);
    (mc[method as keyof RecursosClient] as any).mockRejectedValue(gs);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
}

describe("ResRoutes", () => {
  beforeEach(() => jest.clearAllMocks());

  th("crearRepositorio", "crearRepositorio", r => r.crearRepositorio.bind(r), { body: { id_clase: 1, nombre: "R" } }, 201);
  th("agregarArchivo", "agregarArchivo", r => r.agregarArchivo.bind(r), { body: { id_repositorio: 1, nombre: "A", link: "L", tag: "T", hash: "H" } }, 201);
  th("actualizarVersionArchivo", "actualizarVersionArchivo", r => r.actualizarVersionArchivo.bind(r), { params: { id: "1" }, body: { link: "L", tag: "T", hash: "H" } });
  th("actualizarTag", "actualizarTag", r => r.actualizarTag.bind(r), { params: { idVersion: "1" }, body: { tag: "T" } });
  th("eliminarArchivo", "eliminarArchivo", r => r.eliminarArchivo.bind(r), { params: { id: "1" } });
  th("consultarRepositorio", "consultarRepositorio", r => r.consultarRepositorio.bind(r), { params: { id: "1" } });
  th("consultarVersionesArchivo", "consultarVersionesArchivo", r => r.consultarVersionesArchivo.bind(r), { params: { id: "1" } });
  th("consultarVersionArchivo", "consultarVersionArchivo", r => r.consultarVersionArchivo.bind(r), { params: { idArchivo: "1", idVersion: "1" } });
  th("consultarApunte", "consultarApunte", r => r.consultarApunte.bind(r), { query: { id_clase: "1", id_usuario: "1" } });
  th("crearApunte", "crearApunte", r => r.crearApunte.bind(r), { body: { id_clase: 1, id_usuario: 1, titulo: "T", contenido_markdown: "M" } }, 201);
  th("actualizarApunte", "actualizarApunte", r => r.actualizarApunte.bind(r), { body: { id_apunte: 1, titulo: "T", contenido_markdown: "M" } });
  th("agregarMarcadorTiempo", "agregarMarcadorTiempo", r => r.agregarMarcadorTiempo.bind(r), { body: { id_apunte: 1, segundo: 10, texto: "T" } }, 201);
  th("eliminarMarcadorTiempo", "eliminarMarcadorTiempo", r => r.eliminarMarcadorTiempo.bind(r), { params: { id: "1" } });
  th("consultarDudasClase", "consultarDudasClase", r => r.consultarDudasClase.bind(r), { params: { idClase: "1" }, query: { pagina: "1" } });
  th("crearDuda", "crearDuda", r => r.crearDuda.bind(r), { body: { id_clase: 1, duda: "D", segundo: 10 } }, 201);
  th("crearRespuesta", "crearRespuesta", r => r.crearRespuesta.bind(r), { body: { id_duda: 1, respuesta: "R" } }, 201);
  th("marcarRespuesta", "marcarRespuesta", r => r.marcarRespuesta.bind(r), { params: { id: "1" } });
});
