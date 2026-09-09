import { Response } from "express";
import * as grpc from "@grpc/grpc-js";
import { BaseRoutes } from "./base.routes";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";

class TestRoutes extends BaseRoutes {
  constructor(authMiddleware: AuthMiddleware, roleMiddleware?: RoleMiddleware) {
    super(authMiddleware, roleMiddleware);
  }

  public testHandleError(error: unknown, res: Response, servicio: string): void {
    this.handleError(error, res, servicio);
  }
}

function mockRes(): Response {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

const mockAuthMiddleware: AuthMiddleware = {
  validarSesion: jest.fn(),
};

describe("BaseRoutes", () => {
  let routes: TestRoutes;

  beforeEach(() => {
    jest.clearAllMocks();
    routes = new TestRoutes(mockAuthMiddleware);
  });

  test("handleError INVALID_ARGUMENT → 400", () => {
    const error = Object.assign(new Error("campo requerido"), { code: grpc.status.INVALID_ARGUMENT });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("handleError ALREADY_EXISTS → 409", () => {
    const error = Object.assign(new Error("duplicado"), { code: grpc.status.ALREADY_EXISTS });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test("handleError NOT_FOUND → 404", () => {
    const error = Object.assign(new Error("no existe"), { code: grpc.status.NOT_FOUND });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleError UNAUTHENTICATED → 401", () => {
    const error = Object.assign(new Error("no autenticado"), { code: grpc.status.UNAUTHENTICATED });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("handleError UNAVAILABLE → 503", () => {
    const error = Object.assign(new Error("unavailable"), { code: grpc.status.UNAVAILABLE });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test("handleError default → 500", () => {
    const error = Object.assign(new Error("generico"), { code: grpc.status.INTERNAL });
    const res = mockRes();
    routes.testHandleError(error, res, "test");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("requerirRol sin roleMiddleware → lanza error", () => {
    const routesNoRole = new TestRoutes(mockAuthMiddleware);
    expect(() => routesNoRole["requerirRol"]).toThrow();
  });

  test("idUsuarioSesion retorna id_usuario", () => {
    const req = { usuario: { id_usuario: 42 } } as any;
    const result = routes["idUsuarioSesion"](req);
    expect(result).toBe(42);
  });

  test("idUsuarioSesion retorna 0 sin usuario", () => {
    const req = {} as any;
    const result = routes["idUsuarioSesion"](req);
    expect(result).toBe(0);
  });

  test("validar retorna funcion del middleware", () => {
    const result = routes["validar"];
    expect(typeof result).toBe("function");
  });
});
