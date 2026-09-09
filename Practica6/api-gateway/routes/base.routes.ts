import { Request, Response } from "express";
import * as grpc from "@grpc/grpc-js";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";

export abstract class BaseRoutes {
  protected readonly authMiddleware: AuthMiddleware;
  protected readonly roleMiddleware?: RoleMiddleware;

  constructor(authMiddleware: AuthMiddleware, roleMiddleware?: RoleMiddleware) {
    this.authMiddleware = authMiddleware;
    this.roleMiddleware = roleMiddleware;
  }

  protected get validar() {
    return this.authMiddleware.validarSesion.bind(this.authMiddleware);
  }

  protected get requerirRol() {
    if (!this.roleMiddleware) {
      throw new Error("requerirRol requiere un RoleMiddleware configurado");
    }
    return this.roleMiddleware.requerirRol.bind(this.roleMiddleware);
  }

  protected idUsuarioSesion(req: Request): number {
    return req.usuario?.id_usuario ?? 0;
  }

  protected handleError(error: unknown, res: Response, servicio: string): void {
    const grpcError = error as grpc.ServiceError;
    const mensaje = grpcError.message || "Error interno del servidor";

    switch (grpcError.code) {
      case grpc.status.INVALID_ARGUMENT:
        res.status(400).json({ exito: false, mensaje });
        break;
      case grpc.status.ALREADY_EXISTS:
        res.status(409).json({ exito: false, mensaje });
        break;
      case grpc.status.NOT_FOUND:
        res.status(404).json({ exito: false, mensaje });
        break;
      case grpc.status.UNAUTHENTICATED:
        res.status(401).json({ exito: false, mensaje });
        break;
      case grpc.status.UNAVAILABLE:
        res.status(503).json({
          exito: false,
          mensaje: `Servicio de ${servicio} no disponible`,
        });
        break;
      default:
        res.status(500).json({ exito: false, mensaje });
    }
  }
}
