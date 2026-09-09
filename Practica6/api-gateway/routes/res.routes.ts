import { Router, Request, Response } from "express";
import { RecursosClient } from "../grpc/res.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class ResRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private resClient: RecursosClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.post("/", this.validar, this.requerirRol("Docente", "Administrador"), this.crearRepositorio.bind(this));
    this.router.post("/archivos", this.validar, this.requerirRol("Docente", "Administrador"), this.agregarArchivo.bind(this));
    this.router.put("/archivos/:id/version", this.validar, this.requerirRol("Docente", "Administrador"), this.actualizarVersionArchivo.bind(this));
    this.router.put("/archivos/versiones/:idVersion/tag", this.validar, this.requerirRol("Docente", "Administrador"), this.actualizarTag.bind(this));
    this.router.delete("/archivos/:id", this.validar, this.requerirRol("Docente", "Administrador"), this.eliminarArchivo.bind(this));
    this.router.get("/archivos/:id/versiones", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarVersionesArchivo.bind(this));
    this.router.get("/archivos/:idArchivo/versiones/:idVersion", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarVersionArchivo.bind(this));
    this.router.get("/apunte", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarApunte.bind(this));
    this.router.post("/apunte", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.crearApunte.bind(this));
    this.router.put("/apunte", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.actualizarApunte.bind(this));
    this.router.post("/apunte/marcadores", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.agregarMarcadorTiempo.bind(this));
    this.router.delete("/apunte/marcadores/:id", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.eliminarMarcadorTiempo.bind(this));
    this.router.get("/dudas/:idClase", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarDudasClase.bind(this));
    this.router.post("/dudas", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.crearDuda.bind(this));
    this.router.post("/dudas/respuestas", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.crearRespuesta.bind(this));
    this.router.put("/dudas/respuestas/:id/marcar", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.marcarRespuesta.bind(this));
    this.router.get("/:id", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarRepositorio.bind(this));
  }

  async crearRepositorio(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.crearRepositorio({
        id_clase: req.body.id_clase,
        nombre: req.body.nombre,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async agregarArchivo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.agregarArchivo({
        id_repositorio: req.body.id_repositorio,
        nombre: req.body.nombre,
        link: req.body.link,
        tag: req.body.tag,
        hash: req.body.hash,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async actualizarVersionArchivo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.actualizarVersionArchivo({
        id_archivo: Number(req.params.id),
        link: req.body.link,
        tag: req.body.tag,
        hash: req.body.hash,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async actualizarTag(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.actualizarTag({
        id_version: Number(req.params.idVersion),
        tag: req.body.tag,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async eliminarArchivo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.eliminarArchivo({
        id_archivo: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async consultarRepositorio(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.consultarRepositorio({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async consultarVersionesArchivo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.consultarVersionesArchivo({
        id_archivo: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async consultarVersionArchivo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.consultarVersionArchivo({
        id_archivo: Number(req.params.idArchivo),
        id_version: Number(req.params.idVersion),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async consultarApunte(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.consultarApunte({
        id_clase: Number(req.query.id_clase),
        id_usuario: Number(req.query.id_usuario),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async crearApunte(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.crearApunte({
        id_clase: req.body.id_clase,
        id_usuario: req.body.id_usuario,
        titulo: req.body.titulo,
        contenido_markdown: req.body.contenido_markdown,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async actualizarApunte(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.actualizarApunte({
        id_apunte: req.body.id_apunte,
        titulo: req.body.titulo,
        contenido_markdown: req.body.contenido_markdown,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async agregarMarcadorTiempo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.agregarMarcadorTiempo({
        id_apunte: req.body.id_apunte,
        segundo: req.body.segundo,
        texto: req.body.texto,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async eliminarMarcadorTiempo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.eliminarMarcadorTiempo({
        id_marcador: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async consultarDudasClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.consultarDudasClase({
        id_clase: Number(req.params.idClase),
        pagina: Number(req.query.pagina) || 1,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async crearDuda(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.crearDuda({
        id_clase: req.body.id_clase,
        id_usuario: this.idUsuarioSesion(req),
        duda: req.body.duda,
        segundo: req.body.segundo,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async crearRespuesta(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.crearRespuesta({
        id_duda: req.body.id_duda,
        id_usuario: this.idUsuarioSesion(req),
        respuesta: req.body.respuesta,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }

  async marcarRespuesta(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.resClient.marcarRespuesta({
        id_respuesta: Number(req.params.id),
        id_usuario: this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "recursos");
    }
  }
}
