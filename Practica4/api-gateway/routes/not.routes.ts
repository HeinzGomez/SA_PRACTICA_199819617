import { Router, Request, Response } from "express";
import { NotificacionesClient } from "../grpc/not.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class NotRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private notClient: NotificacionesClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.post("/registro", this.enviarRegistro.bind(this));
    this.router.post(
      "/contenido",
      this.validar,
      this.requerirRol("Docente", "Auxiliar", "Administrador"),
      this.enviarContenidoNuevo.bind(this)
    );
    this.router.post(
      "/aviso",
      this.validar,
      this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"),
      this.enviarAvisoGeneral.bind(this)
    );
    this.router.get(
      "/",
      this.validar,
      this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"),
      this.consultarNotificaciones.bind(this)
    );
    this.router.get(
      "/audit",
      this.validar,
      this.requerirRol("Administrador"),
      this.consultarAudit.bind(this)
    );
  }

  async enviarRegistro(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notClient.enviarNotificacionRegistro({
        id_usuario: this.idUsuarioSesion(req),
        correo: req.body.correo,
        nombre_usuario: req.body.nombre_usuario,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "notificaciones");
    }
  }

  async enviarContenidoNuevo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notClient.enviarNotificacionContenidoNuevo({
        id_usuario: this.idUsuarioSesion(req),
        correos: req.body.correos ?? [],
        titulo_contenido: req.body.titulo_contenido,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "notificaciones");
    }
  }

  async enviarAvisoGeneral(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notClient.enviarNotificacionAvisoGeneral({
        id_usuario: this.idUsuarioSesion(req),
        correo: req.body.correo,
        asunto: req.body.asunto,
        mensaje: req.body.mensaje,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "notificaciones");
    }
  }

  async consultarNotificaciones(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notClient.consultarNotificaciones({
        id_usuario: this.idUsuarioSesion(req),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "notificaciones");
    }
  }

  async consultarAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.notClient.consultarAuditLogs({
        pagina: Number(req.query.pagina ?? 1),
        usuario_filtro: Number(req.query.usuario_filtro ?? 0),
        tabla_filtro: String(req.query.tabla_filtro ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "notificaciones");
    }
  }
}
