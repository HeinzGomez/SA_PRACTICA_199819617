import { NextFunction, Request, Response } from "express";
import * as grpc from "@grpc/grpc-js";
import { AuthClient } from "../grpc/auth.client";
import { Sesion, Usuario } from "../types/auth.types";

declare global {
  namespace Express {
    interface Request {
      sesion?: Sesion;
      usuario?: Usuario;
    }
  }
}

export interface AuthMiddleware {
  validarSesion(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export class AuthMiddlewareImp implements AuthMiddleware {
  constructor(private authClient: AuthClient) {}

  async validarSesion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accessToken = this.extraerToken(req);
      if (!accessToken) {
        res.status(401).json({ exito: false, mensaje: "Token de acceso no proporcionado" });
        return;
      }

      const { exito, sesion, usuario } = await this.authClient.validarSesion({
        access_token: accessToken,
      });

      if (!exito) {
        res.status(401).json({ exito: false, mensaje: "La sesión no es válida o ha expirado" });
        return;
      }

      req.sesion = sesion;
      req.usuario = usuario;
      next();
    } catch (error) {
      const grpcError = error as grpc.ServiceError;
      if (grpcError.code === grpc.status.UNAVAILABLE) {
        res.status(503).json({
          exito: false,
          mensaje: "Servicio de autenticación no disponible",
        });
        return;
      }
      res.status(401).json({
        exito: false,
        mensaje: grpcError.message || "Sesión inválida",
      });
    }
  }

  private extraerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice("Bearer ".length);
    }

    const cookie = req.headers.cookie;
    if (cookie) {
      const match = cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("access_token="));
      if (match) {
        return match.slice("access_token=".length);
      }
    }

    return null;
  }
}
