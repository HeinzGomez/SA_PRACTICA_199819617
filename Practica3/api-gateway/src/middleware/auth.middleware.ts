import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Valida el JWT recibido via Session Cookie (HttpOnly/Secure) o Authorization
 * header. Este es el unico punto donde el sistema confia en la identidad del
 * usuario antes de reenviar la peticion, ya traducida a gRPC, hacia los
 * microservicios internos.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[env.sessionCookieName];
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = cookieToken ?? bearer;

  if (!token) {
    return res.status(401).json({ error: "No autenticado: falta sesion o token." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthenticatedUser & { exp: number };
    req.user = { userId: payload.userId, email: payload.email, roles: payload.roles };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sesion invalida o expirada." });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado." });
    }
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "No autorizado para este recurso (RBAC)." });
    }
    next();
  };
}

/** Rechaza correos que no pertenezcan al dominio institucional permitido. */
export function isInstitutionalEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && env.allowedEmailDomains.includes(domain);
}
