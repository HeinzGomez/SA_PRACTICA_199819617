import { HistorialClient } from "../grpc/his.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { HisRoutes } from "./his.routes";
import * as grpc from "@grpc/grpc-js";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mc: jest.Mocked<HistorialClient> = {
  registrarProgreso: jest.fn(), actualizarCheckpoint: jest.fn(), marcarClaseCompletada: jest.fn(),
  obtenerCheckpointClase: jest.fn(), consultarHistorialUsuario: jest.fn(), consultarEstadisticasUsuario: jest.fn(),
  eliminarHistorialClase: jest.fn(), consultarAuditLogs: jest.fn(),
};
const amw: AuthMiddleware = { validarSesion: jest.fn() };
const rmw: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok" };

describe("HisRoutes", () => {
  let r: HisRoutes;
  beforeEach(() => { jest.clearAllMocks(); r = new HisRoutes(mc, amw, rmw); });

  const handlers: [string, string, keyof typeof mc, Record<string, unknown>][] = [
    ["registrarProgreso", "201", "registrarProgreso", { body: { id_clase: 1, id_tema: 1, minuto_actual: 10, segundo_actual: 30, duracion_total: 120 } }],
    ["actualizarCheckpoint", "200", "actualizarCheckpoint", { body: { id_clase: 1, id_tema: 1, minuto_actual: 10, segundo_actual: 30 } }],
    ["marcarClaseCompletada", "200", "marcarClaseCompletada", { params: { id: "1" } }],
    ["obtenerCheckpointClase", "200", "obtenerCheckpointClase", { params: { id: "1" } }],
    ["eliminarHistorialClase", "200", "eliminarHistorialClase", { params: { id: "1" } }],
    ["consultarHistorial", "200", "consultarHistorialUsuario", { query: { pagina: "1" } }],
    ["consultarEstadisticas", "200", "consultarEstadisticasUsuario", {}],
    ["consultarAudit", "200", "consultarAuditLogs", { query: { pagina: "1" } }],
  ];

  for (const [method, status, mockMethod, reqOpts] of handlers) {
    test(`${method} exito`, async () => {
      (mc[mockMethod] as any).mockResolvedValue(OK);
      const res = mockRes();
      await (r as any)[method](R(reqOpts), res);
      expect(res.status).toHaveBeenCalledWith(Number(status));
    });
    test(`${method} error`, async () => {
      (mc[mockMethod] as any).mockRejectedValue(gs);
      const res = mockRes();
      await (r as any)[method](R(reqOpts), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  }
});
