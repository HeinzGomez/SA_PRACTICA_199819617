import { Router, Request, Response } from "express";
import { HistorialClient } from "../grpc/his.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class HisRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private hisClient: HistorialClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.post("/progreso", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.registrarProgreso.bind(this));
    this.router.patch("/progreso", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.actualizarCheckpoint.bind(this));
    this.router.post("/clase/:id/completar", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.marcarClaseCompletada.bind(this));
    this.router.get("/clase/:id/checkpoint", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.obtenerCheckpointClase.bind(this));
    this.router.delete("/clase/:id", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.eliminarHistorialClase.bind(this));
    this.router.get("/usuario/historial", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarHistorial.bind(this));
    this.router.get("/usuario/estadisticas", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarEstadisticas.bind(this));
    this.router.get("/audit", this.validar, this.requerirRol("Administrador"), this.consultarAudit.bind(this));
  }

  async registrarProgreso(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.registrarProgreso({
        id_usuario: this.idUsuarioSesion(req),
        id_clase: req.body.id_clase,
        id_tema: req.body.id_tema,
        minuto_actual: req.body.minuto_actual,
        segundo_actual: req.body.segundo_actual,
        duracion_total: req.body.duracion_total,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async actualizarCheckpoint(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.actualizarCheckpoint({
        id_usuario: this.idUsuarioSesion(req),
        id_clase: req.body.id_clase,
        id_tema: req.body.id_tema,
        minuto_actual: req.body.minuto_actual,
        segundo_actual: req.body.segundo_actual,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async marcarClaseCompletada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.marcarClaseCompletada({
        id_usuario: this.idUsuarioSesion(req),
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async obtenerCheckpointClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.obtenerCheckpointClase({
        id_usuario: this.idUsuarioSesion(req),
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async eliminarHistorialClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.eliminarHistorialClase({
        id_usuario: this.idUsuarioSesion(req),
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async consultarHistorial(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.consultarHistorialUsuario({
        id_usuario: this.idUsuarioSesion(req),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async consultarEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.consultarEstadisticasUsuario({
        id_usuario: this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }

  async consultarAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.hisClient.consultarAuditLogs({
        pagina: Number(req.query.pagina ?? 1),
        usuario_filtro: Number(req.query.usuario_filtro ?? 0),
        tabla_filtro: String(req.query.tabla_filtro ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "historial");
    }
  }
}
