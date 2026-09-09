import { AuthClient } from "../grpc/auth.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { OAuthOnboardingService } from "../services/oauth-onboarding.service";
import { AuthRoutes } from "./auth.routes";
import * as grpc from "@grpc/grpc-js";
import { mockRes, mockReq, gs } from "../__mocks__/test.helpers";

const mockAuthClient: jest.Mocked<AuthClient> = {
  registrarUsuario: jest.fn(), crearSesion: jest.fn(), cerrarSesion: jest.fn(),
  validarSesion: jest.fn(), cambiarPassword: jest.fn(), consultarAuditLogs: jest.fn(),
  consultarUsuario: jest.fn(), consultarUsuarios: jest.fn(),
  iniciarOAuthGoogle: jest.fn(), autenticarConGoogle: jest.fn(),
};
const mockAuthMW: AuthMiddleware = { validarSesion: jest.fn() };
const mockRoleMW: RoleMiddleware = { requerirRol: jest.fn(() => (req: any, res: any, next: Function) => next()) };
const mockOnb: jest.Mocked<OAuthOnboardingService> = { asegurarEstudiante: jest.fn() };
const R = (o: Record<string, unknown> = {}) => mockReq(o);
const OK = { exito: true, mensaje: "ok", access_token: "t", refresh_token: "r" };
const fullUser = { id_usuario: 1, nombre: "A", apellido: "B", correo_institucional: "a@b.com", estado: "", fecha_registro: "" };
const fullSesion = { id_sesion: 1, id_usuario: 1, fecha_creacion: "", fecha_expiracion: "", estado: "" };

describe("AuthRoutes", () => {
  let r: AuthRoutes;
  beforeEach(() => { jest.clearAllMocks(); r = new AuthRoutes(mockAuthClient, mockAuthMW, mockOnb, mockRoleMW); });

  test("registrar exito", async () => {
    mockAuthClient.registrarUsuario.mockResolvedValue({ exito: true, mensaje: "ok", usuario: undefined });
    const res = mockRes(); await r["registrar"](R({ body: { nombre: "A", apellido: "B", correo: "a@b.com", password: "123" } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  test("registrar error", async () => {
    mockAuthClient.registrarUsuario.mockRejectedValue(gs);
    const res = mockRes(); await r["registrar"](R({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("login exito", async () => {
    mockAuthClient.crearSesion.mockResolvedValue(OK as any);
    const res = mockRes(); await r["login"](R({ body: { correo: "a@b.com", password: "123" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("login falla", async () => {
    mockAuthClient.crearSesion.mockResolvedValue({ exito: false, mensaje: "fail", access_token: "", refresh_token: "" });
    const res = mockRes(); await r["login"](R({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("login error", async () => {
    mockAuthClient.crearSesion.mockRejectedValue(gs);
    const res = mockRes(); await r["login"](R({}), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("logout con sesion", async () => {
    mockAuthClient.cerrarSesion.mockResolvedValue({ exito: true, mensaje: "ok" });
    const res = mockRes(); await r["logout"](R({ sesion: fullSesion }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("logout sin sesion", async () => {
    const res = mockRes(); await r["logout"](R({}), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("logout error", async () => {
    mockAuthClient.cerrarSesion.mockRejectedValue(gs);
    const res = mockRes(); await r["logout"](R({ sesion: fullSesion }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("validarSesion", async () => {
    const res = mockRes(); await r["validarSesion"](R({ sesion: fullSesion, usuario: fullUser }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("cambiarPassword exito", async () => {
    mockAuthClient.cambiarPassword.mockResolvedValue({ exito: true, mensaje: "ok" });
    const res = mockRes(); await r["cambiarPassword"](R({ usuario: fullUser, body: { password_actual: "old", password_nueva: "new" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("cambiarPassword sin usuario", async () => {
    const res = mockRes(); await r["cambiarPassword"](R({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("cambiarPassword error", async () => {
    mockAuthClient.cambiarPassword.mockRejectedValue(gs);
    const res = mockRes(); await r["cambiarPassword"](R({ usuario: fullUser, body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("consultarAudit", async () => {
    mockAuthClient.consultarAuditLogs.mockResolvedValue({ exito: true, mensaje: "ok", registros: [], total_paginas: 0 });
    const res = mockRes(); await r["consultarAudit"](R({ query: { pagina: "1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("consultarAudit error", async () => {
    mockAuthClient.consultarAuditLogs.mockRejectedValue(gs);
    const res = mockRes(); await r["consultarAudit"](R({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("consultarUsuario", async () => {
    mockAuthClient.consultarUsuario.mockResolvedValue({ exito: true, mensaje: "ok", usuario: undefined });
    const res = mockRes(); await r["consultarUsuario"](R({ params: { id: "1" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("consultarUsuario error", async () => {
    mockAuthClient.consultarUsuario.mockRejectedValue(gs);
    const res = mockRes(); await r["consultarUsuario"](R({ params: { id: "1" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("consultarUsuarios", async () => {
    mockAuthClient.consultarUsuarios.mockResolvedValue({ exito: true, mensaje: "ok", usuarios: [] });
    const res = mockRes(); await r["consultarUsuarios"](R(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test("consultarUsuarios error", async () => {
    mockAuthClient.consultarUsuarios.mockRejectedValue(gs);
    const res = mockRes(); await r["consultarUsuarios"](R(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("iniciarOAuthGoogle exito", async () => {
    mockAuthClient.iniciarOAuthGoogle.mockResolvedValue({ exito: true, mensaje: "ok", authorization_url: "https://g.com" });
    const res = mockRes(); await r["iniciarOAuthGoogle"](R({ query: { state: "s" } }), res);
    expect(res.redirect).toHaveBeenCalledWith("https://g.com");
  });
  test("iniciarOAuthGoogle falla", async () => {
    mockAuthClient.iniciarOAuthGoogle.mockResolvedValue({ exito: false, mensaje: "f", authorization_url: "" });
    const res = mockRes(); await r["iniciarOAuthGoogle"](R({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("iniciarOAuthGoogle error", async () => {
    mockAuthClient.iniciarOAuthGoogle.mockRejectedValue(gs);
    const res = mockRes(); await r["iniciarOAuthGoogle"](R({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("autenticarConGoogle sin params", async () => {
    const res = mockRes(); await r["autenticarConGoogle"](R({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  test("autenticarConGoogle falla auth", async () => {
    mockAuthClient.autenticarConGoogle.mockResolvedValue({ exito: false, mensaje: "f", access_token: "", refresh_token: "" });
    const res = mockRes(); await r["autenticarConGoogle"](R({ query: { code: "c", state: "s" } }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
  test("autenticarConGoogle exito con onboarding", async () => {
    mockAuthClient.autenticarConGoogle.mockResolvedValue({ exito: true, mensaje: "ok", access_token: "tok", refresh_token: "ref", usuario: fullUser });
    mockOnb.asegurarEstudiante.mockResolvedValue(true);
    const res = mockRes(); await r["autenticarConGoogle"](R({ query: { code: "c", state: "s" } }), res);
    expect(res.redirect).toHaveBeenCalled();
  });
  test("autenticarConGoogle exito sin onboarding", async () => {
    const r2 = new AuthRoutes(mockAuthClient, mockAuthMW, undefined, mockRoleMW);
    mockAuthClient.autenticarConGoogle.mockResolvedValue({ exito: true, mensaje: "ok", access_token: "tok", refresh_token: "", usuario: fullUser });
    const res = mockRes(); await r2["autenticarConGoogle"](R({ query: { code: "c", state: "s" } }), res);
    expect(res.redirect).toHaveBeenCalled();
  });
  test("autenticarConGoogle onboarding error", async () => {
    mockAuthClient.autenticarConGoogle.mockResolvedValue({ exito: true, mensaje: "ok", access_token: "tok", refresh_token: "", usuario: fullUser });
    mockOnb.asegurarEstudiante.mockRejectedValue(new Error("fail"));
    const res = mockRes(); await r["autenticarConGoogle"](R({ query: { code: "c", state: "s" } }), res);
    expect(res.redirect).toHaveBeenCalled();
  });
  test("autenticarConGoogle gRPC error", async () => {
    mockAuthClient.autenticarConGoogle.mockRejectedValue(gs);
    const res = mockRes(); await r["autenticarConGoogle"](R({ query: { code: "c", state: "s" } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
