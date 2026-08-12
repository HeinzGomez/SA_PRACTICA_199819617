import { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error("[api-gateway] Unhandled error:", err);
  const grpcCode = err?.code;
  const status = grpcCode === 5 ? 404 : grpcCode === 3 ? 400 : grpcCode === 16 ? 401 : 500;
  res.status(status).json({
    error: err?.details ?? err?.message ?? "Error interno del servidor.",
  });
}
