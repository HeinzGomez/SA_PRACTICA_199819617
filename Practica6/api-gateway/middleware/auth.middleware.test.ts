import { Request, Response, NextFunction } from "express";
import { AuthClient } from "../grpc/auth.client";
import { AuthMiddlewareImp } from "./auth.middleware";
import * as grpc from "@grpc/grpc-js";

const mockAuthClient: jest.Mocked<AuthClient> = {
  registrarUsuario: jest.fn(),
  crearSesion: jest.fn(),
  cerrarSesion: jest.fn(),
  validarSesion: jest.fn(),
  cambiarPassword: jest.fn(),
  consultarAuditLogs: jest.fn(),
  consultarUsuario: jest.fn(),
  consultarUsuarios: jest.fn(),
  iniciarOAuthGoogle: jest.fn(),
  autenticarConGoogle: jest.fn(),
};

function mockRes(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function mockReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

describe("AuthMiddleware", () => {
  let middleware: AuthMiddlewareImp;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new AuthMiddlewareImp(mockAuthClient);
  });

  test("sin token → 401", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("token invalido → 401", async () => {
    mockAuthClient.validarSesion.mockResolvedValue({ exito: false, mensaje: "invalido" });
    const req = mockReq({ authorization: "Bearer abc" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("token valido → next()", async () => {
    mockAuthClient.validarSesion.mockResolvedValue({
      exito: true,
      mensaje: "ok",
      sesion: { id_sesion: 1, id_usuario: 1, fecha_creacion: "", fecha_expiracion: "", estado: "" },
      usuario: { id_usuario: 1, nombre: "Test", apellido: "User", correo_institucional: "t@t.com", estado: "", fecha_registro: "" },
    });
    const req = mockReq({ authorization: "Bearer valid-token" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(401);
  });

  test("gRPC UNAVAILABLE → 503", async () => {
    mockAuthClient.validarSesion.mockRejectedValue(Object.assign(new Error("unavailable"), { code: grpc.status.UNAVAILABLE }));
    const req = mockReq({ authorization: "Bearer abc" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  test("token desde cookie", async () => {
    mockAuthClient.validarSesion.mockResolvedValue({
      exito: true,
      mensaje: "ok",
      sesion: { id_sesion: 1, id_usuario: 1, fecha_creacion: "", fecha_expiracion: "", estado: "" },
      usuario: { id_usuario: 1, nombre: "Test", apellido: "User", correo_institucional: "t@t.com", estado: "", fecha_registro: "" },
    });
    const req = mockReq({ cookie: "access_token=cookie-token" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("cookie sin access_token → 401", async () => {
    const req = mockReq({ cookie: "other=value" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("gRPC error generico → 401", async () => {
    mockAuthClient.validarSesion.mockRejectedValue(Object.assign(new Error("generico"), { code: grpc.status.INTERNAL }));
    const req = mockReq({ authorization: "Bearer abc" });
    const res = mockRes();
    const next = jest.fn();
    await middleware.validarSesion(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
