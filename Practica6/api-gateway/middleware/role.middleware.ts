import { NextFunction, Request, RequestHandler, Response } from "express";
import * as grpc from "@grpc/grpc-js";
import { InscripcionClient } from "../grpc/ins.client";

const ROL_ADMINISTRADOR = "Administrador";

export interface RoleMiddleware {
  requerirRol(...roles: string[]): RequestHandler;
}

export class RoleMiddlewareImp implements RoleMiddleware {
  constructor(private insClient: InscripcionClient) {}

  requerirRol(...rolesRequeridos: string[]): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const idUsuario = req.usuario?.id_usuario;
        if (!idUsuario) {
          res.status(401).json({ exito: false, mensaje: "No hay una sesión válida" });
          return;
        }

        const { roles } = await this.insClient.consultarRolesUsuario({ id_usuario: idUsuario });
        const nombresRoles = roles.map((rol) => rol.rol.toLowerCase());

        const esAdmin = nombresRoles.includes(ROL_ADMINISTRADOR.toLowerCase());
        const tieneRol = rolesRequeridos.some((rol) =>
          nombresRoles.includes(rol.toLowerCase())
        );

        if (esAdmin || tieneRol) {
          next();
          return;
        }

        res.status(403).json({
          exito: false,
          mensaje: "No tiene los permisos necesarios para esta acción",
        });
      } catch (error) {
        const grpcError = error as grpc.ServiceError;
        if (grpcError.code === grpc.status.UNAVAILABLE) {
          res.status(503).json({
            exito: false,
            mensaje: "Servicio de inscripción no disponible",
          });
          return;
        }
        res.status(500).json({
          exito: false,
          mensaje: grpcError.message || "Error interno del servidor",
        });
      }
    };
  }
}
