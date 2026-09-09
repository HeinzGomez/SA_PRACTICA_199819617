import { Request, Response, NextFunction } from "express";
import { InscripcionClient } from "../grpc/ins.client";
import { RoleMiddlewareImp } from "./role.middleware";
import * as grpc from "@grpc/grpc-js";

const mockInsClient: jest.Mocked<InscripcionClient> = {
  crearArea: jest.fn(), editarArea: jest.fn(), eliminarArea: jest.fn(), consultarAreas: jest.fn(),
  crearCurso: jest.fn(), editarCurso: jest.fn(), eliminarCurso: jest.fn(), consultarCursos: jest.fn(),
  crearPensum: jest.fn(), editarPensum: jest.fn(), eliminarPensum: jest.fn(), consultarPensums: jest.fn(),
  crearCarrera: jest.fn(), editarCarrera: jest.fn(), eliminarCarrera: jest.fn(), consultarCarreras: jest.fn(),
  crearPeriodo: jest.fn(), editarPeriodo: jest.fn(), eliminarPeriodo: jest.fn(), consultarPeriodos: jest.fn(),
  crearPerfilAcademico: jest.fn(), cambiarPerfilAcademico: jest.fn(),
  consultarPerfilAcademico: jest.fn(), consultarPerfilesEstudiante: jest.fn(),
  asignarRolUsuario: jest.fn(), cambiarRolUsuario: jest.fn(), eliminarRolUsuario: jest.fn(),
  comprobarRolUsuario: jest.fn(), consultarRolesUsuario: jest.fn(),
  inscribirEstudiante: jest.fn(), actualizarEstadoMatricula: jest.fn(),
  consultarCursosEstudiante: jest.fn(), consultarTodasInscripciones: jest.fn(),
  consultarEstadosMatricula: jest.fn(), consultarAuditLogs: jest.fn(),
};

function mockRes(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

function mockReq(usuario?: { id_usuario: number }): Request {
  return { usuario } as unknown as Request;
}

describe("RoleMiddleware", () => {
  let middleware: RoleMiddlewareImp;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new RoleMiddlewareImp(mockInsClient);
  });

  test("sin usuario → 401", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Administrador");
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("con rol requerido → next()", async () => {
    mockInsClient.consultarRolesUsuario.mockResolvedValue({
      exito: true, mensaje: "ok",
      roles: [{ id_usuario: 1, id_rol: 1, rol: "Docente", descripcion: "Docente" }],
    });
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Docente");
    await handler(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  test("sin rol requerido → 403", async () => {
    mockInsClient.consultarRolesUsuario.mockResolvedValue({
      exito: true, mensaje: "ok",
      roles: [{ id_usuario: 1, id_rol: 1, rol: "Estudiante", descripcion: "Estudiante" }],
    });
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Administrador");
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("admin siempre pasa", async () => {
    mockInsClient.consultarRolesUsuario.mockResolvedValue({
      exito: true, mensaje: "ok",
      roles: [{ id_usuario: 1, id_rol: 1, rol: "Administrador", descripcion: "Administrador" }],
    });
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Docente");
    await handler(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test("gRPC UNAVAILABLE → 503", async () => {
    mockInsClient.consultarRolesUsuario.mockRejectedValue(
      Object.assign(new Error("unavailable"), { code: grpc.status.UNAVAILABLE })
    );
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Docente");
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });

  test("gRPC error generico → 500", async () => {
    mockInsClient.consultarRolesUsuario.mockRejectedValue(
      Object.assign(new Error("generico"), { code: grpc.status.INTERNAL })
    );
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("Docente");
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  test("case insensitive", async () => {
    mockInsClient.consultarRolesUsuario.mockResolvedValue({
      exito: true, mensaje: "ok",
      roles: [{ id_usuario: 1, id_rol: 1, rol: "DOCENTE", descripcion: "Docente" }],
    });
    const req = mockReq({ id_usuario: 1 });
    const res = mockRes();
    const next = jest.fn();
    const handler = middleware.requerirRol("docente");
    await handler(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
