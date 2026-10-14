// HeinzGomez - Práctica 9: middleware compartidos del API Gateway
// (SRP: autenticación, control de roles, envoltorio de promesas y traducción de errores a HTTP).
import { NextFunction, Request, Response } from 'express';
import { HTTP_DE_ERROR, Servicios, UsuarioSesion } from '../types';

/** Pasa los rechazos de las rutas async al manejador de errores central. */
export const envolver = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res).catch(next);
  };

/** Valida el JWT contra `auth.validate_token` (por el broker) y adjunta `req.usuario`. */
export const autenticar = (s: Servicios) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!token) { res.status(401).json({ error: 'Token requerido' }); return; }
    s.auth.validarToken({ token }).then((v) => {
      if (!v?.valido || !v.usuario) { res.status(401).json({ error: 'Token inválido o expirado' }); return; }
      req.usuario = v.usuario;
      next();
    }).catch(next);
  };

/** Exige un rol concreto una vez validada la sesión. */
export const soloRol = (rol: UsuarioSesion['rol']) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (req.usuario?.rol === rol) { next(); return; }
    res.status(403).json({ error: `Requiere rol ${rol}` });
  };

/** Código del contrato del bus -> estado HTTP. */
export function httpStatus(err: unknown): number {
  const codigo = (err as { code?: unknown } | null | undefined)?.code;
  return typeof codigo === 'string' ? HTTP_DE_ERROR[codigo] ?? 500 : 500;
}

export const noEncontrado = (_req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

/** Último middleware (orden 4: solo errores) nunca filtra el detalle interno. */
export const manejarErrores = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const status = httpStatus(err);
  const genericos: Record<number, string> = {
    500: 'Error interno',
    503: 'Servicio temporalmente no disponible, intente de nuevo',
  };
  res.status(status).json({ error: genericos[status] ?? err?.details ?? err?.message });
};
