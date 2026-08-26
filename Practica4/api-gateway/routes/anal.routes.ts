import { Router, Request, Response } from "express";
import { AnaliticaClient } from "../grpc/anal.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class AnalRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private analClient: AnaliticaClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.post("/unidad", this.validar, this.requerirRol("Administrador"), this.crearUnidad.bind(this));
    this.router.patch("/unidad", this.validar, this.requerirRol("Administrador"), this.editarUnidad.bind(this));
    this.router.delete("/unidad/:id_unidad", this.validar, this.requerirRol("Administrador"), this.eliminarUnidad.bind(this));
    this.router.get("/unidades", this.validar, this.consultarUnidades.bind(this));

    this.router.post("/tema", this.validar, this.requerirRol("Administrador"), this.crearTema.bind(this));
    this.router.patch("/tema", this.validar, this.requerirRol("Administrador"), this.editarTema.bind(this));
    this.router.delete("/tema/:id_tema", this.validar, this.requerirRol("Administrador"), this.eliminarTema.bind(this));
    this.router.get("/temas", this.validar, this.consultarTemas.bind(this));

    this.router.post("/clase", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.crearClaseGrabada.bind(this));
    this.router.patch("/clase", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.editarClaseGrabada.bind(this));
    this.router.delete("/clase/:id_clase", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.eliminarClaseGrabada.bind(this));
    this.router.get("/clases", this.validar, this.consultarCatalogoClases.bind(this));
    this.router.post("/clase/asignar-tema", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.asignarTemaClaseGrabada.bind(this));
    this.router.delete("/clase/:id_clase/tema/:id_tema", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.desasignarTemaClaseGrabada.bind(this));
    this.router.post("/clases/batch", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.cargaMasivaClases.bind(this));

    this.router.post("/clase/visualizar", this.validar, this.visualizarClase.bind(this));
    this.router.post("/clase/calificar", this.validar, this.calificarClase.bind(this));
    this.router.get("/clase/:id_clase/calificacion", this.validar, this.consultarCalificacionUsuario.bind(this));

    this.router.get("/clases/mas-vistas", this.validar, this.consultarClasesMasVistas.bind(this));
    this.router.get("/clases/tendencia", this.validar, this.consultarTemasTendencia.bind(this));
    this.router.get("/clases/ranking", this.validar, this.consultarRankingValoradas.bind(this));

    this.router.get("/audit", this.validar, this.requerirRol("Administrador"), this.consultarAuditLogs.bind(this));
  }

  async crearUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.crearUnidad({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async editarUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.editarUnidad({
        id_unidad: req.body.id_unidad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async eliminarUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.eliminarUnidad({
        id_unidad: Number(req.params.id_unidad ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarUnidades(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarUnidades({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async crearTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.crearTema({
        id_unidad: req.body.id_unidad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async editarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.editarTema({
        id_tema: req.body.id_tema,
        id_unidad: req.body.id_unidad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async eliminarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.eliminarTema({
        id_tema: Number(req.params.id_tema ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarTemas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarTemas({
        id_unidad: Number(req.query.id_unidad ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async crearClaseGrabada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.crearClaseGrabada({
        id_curso: req.body.id_curso,
        id_periodo: req.body.id_periodo,
        id_area: req.body.id_area,
        titulo: req.body.titulo,
        fecha_impartida: req.body.fecha_impartida ?? "",
        duracion_min: req.body.duracion_min,
        descripcion: req.body.descripcion ?? "",
        url_video: req.body.url_video ?? "",
        anio: req.body.anio,
        num_semestre: req.body.num_semestre,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async editarClaseGrabada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.editarClaseGrabada({
        id_clase: req.body.id_clase,
        id_curso: req.body.id_curso,
        id_periodo: req.body.id_periodo,
        id_area: req.body.id_area,
        titulo: req.body.titulo,
        fecha_impartida: req.body.fecha_impartida ?? "",
        duracion_min: req.body.duracion_min,
        descripcion: req.body.descripcion ?? "",
        url_video: req.body.url_video ?? "",
        anio: req.body.anio,
        num_semestre: req.body.num_semestre,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async eliminarClaseGrabada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.eliminarClaseGrabada({
        id_clase: Number(req.params.id_clase ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarCatalogoClases(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarCatalogoClases({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async asignarTemaClaseGrabada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.asignarTemaClaseGrabada({
        id_clase: req.body.id_clase,
        id_tema: req.body.id_tema,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async desasignarTemaClaseGrabada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.desasignarTemaClaseGrabada({
        id_clase: Number(req.params.id_clase),
        id_tema: Number(req.params.id_tema),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async cargaMasivaClases(req: Request, res: Response): Promise<void> {
    try {
      // Expect body to be an array of clase objects: [{...}, {...}]
      const payload = { clases: Array.isArray(req.body) ? req.body : [] };
      const result = await this.analClient.cargaMasivaClases(payload as any);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async visualizarClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.visualizarClase({
        id_clase: req.body.id_clase,
        id_usuario: req.body.id_usuario ?? this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async calificarClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.calificarClase({
        id_clase: req.body.id_clase,
        puntuacion: req.body.puntuacion,
        id_usuario: req.body.id_usuario ?? this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarCalificacionUsuario(req: Request, res: Response): Promise<void> {
    try {
      const idUsuario = this.idUsuarioSesion(req);
      if (!idUsuario) {
        res.status(401).json({ exito: false, mensaje: "No hay una sesión válida" });
        return;
      }
      const result = await this.analClient.consultarCalificacionUsuario({
        id_clase: Number(req.params.id_clase ?? 0),
        id_usuario: idUsuario,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarClasesMasVistas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarClasesMasVistas({
        fecha_inicio: String(req.query.fecha_inicio ?? ""),
        fecha_fin: String(req.query.fecha_fin ?? ""),
        limite: Number(req.query.limite ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarTemasTendencia(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarTemasTendencia({
        fecha_inicio: String(req.query.fecha_inicio ?? ""),
        fecha_fin: String(req.query.fecha_fin ?? ""),
        limite: Number(req.query.limite ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarRankingValoradas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarRankingValoradas({
        limite: Number(req.query.limite ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }

  async consultarAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.analClient.consultarAuditLogs({
        pagina: Number(req.query.pagina ?? 1),
        usuario_filtro: Number(req.query.usuario_filtro ?? 0),
        tabla_filtro: String(req.query.tabla_filtro ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "analítica");
    }
  }
}
