import { NotificacionesClient } from "../grpc/not.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { NotRoutes } from "./not.routes";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<NotificacionesClient> = {
  enviarNotificacionRegistro: jest.fn(), enviarNotificacionContenidoNuevo: jest.fn(),
  enviarNotificacionAvisoGeneral: jest.fn(), consultarNotificaciones: jest.fn(), consultarAuditLogs: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };
const U = { id_usuario: 1, nombre: "A", apellido: "B", correo_institucional: "a@b.com", estado: "", fecha_registro: "" };

function th(name: string, method: string, fn: (r: NotRoutes) => (req: any, res: any) => Promise<void>, reqOpts: Record<string, unknown>, status = 201) {
  test(`${name} ok`, async () => {
    const r = new NotRoutes(mc, amw, rmw);
    (mc[method as keyof NotificacionesClient] as any).mockResolvedValue(OK);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(status);
  });
  test(`${name} err`, async () => {
    const r = new NotRoutes(mc, amw, rmw);
    (mc[method as keyof NotificacionesClient] as any).mockRejectedValue(gs);
    const res = mockRes(); await fn(r)(R(reqOpts) as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
}

describe("NotRoutes", () => {
  beforeEach(() => jest.clearAllMocks());

  th("enviarRegistro", "enviarNotificacionRegistro", r => r.enviarRegistro.bind(r), { body: { correo: "a@b.com", nombre_usuario: "A" } });
  th("enviarContenidoNuevo", "enviarNotificacionContenidoNuevo", r => r.enviarContenidoNuevo.bind(r), { body: { correos: ["a@b.com"], titulo_contenido: "T" } });
  th("enviarAvisoGeneral", "enviarNotificacionAvisoGeneral", r => r.enviarAvisoGeneral.bind(r), { body: { correo: "a@b.com", asunto: "A", mensaje: "M" } });
  th("consultarNotificaciones", "consultarNotificaciones", r => r.consultarNotificaciones.bind(r), { query: { pagina: "1" }, usuario: U }, 200);
  th("consultarAudit", "consultarAuditLogs", r => r.consultarAudit.bind(r), { query: { pagina: "1" } }, 200);
});
