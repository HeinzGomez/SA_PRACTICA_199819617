import { Router, Request, Response } from "express";
import { GrabacionesClient } from "../grpc/grab.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class GrabRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private grabClient: GrabacionesClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.get("/clases", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.catalogoClases.bind(this));
    this.router.get("/clases/busqueda", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.busquedaAvanzada.bind(this));
    this.router.get("/clase/:id", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.detalleClase.bind(this));
    this.router.get("/clase/:id/enlace", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.enlaceClase.bind(this));
    this.router.get("/clase/:id/participantes", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.participantesClase.bind(this));

    this.router.post("/clase", this.validar, this.requerirRol("Docente","Auxiliar", "Administrador"), this.crearClase.bind(this));
    this.router.patch("/clase/:id", this.validar, this.requerirRol("Docente","Auxiliar", "Administrador"), this.editarClase.bind(this));
    this.router.delete("/clase/:id", this.validar, this.requerirRol("Administrador","Auxiliar","Docente"), this.eliminarClase.bind(this));
    this.router.post("/clase/:id/docente", this.validar, this.requerirRol("Administrador","Auxiliar","Docente"), this.asignarDocente.bind(this));
    this.router.delete("/clase/:id/docente/:id_usuario", this.validar, this.requerirRol("Administrador","Auxiliar","Docente"), this.desasignarDocente.bind(this));
    this.router.post("/clase/:id/auxiliar", this.validar, this.requerirRol("Administrador","Auxiliar","Docente"), this.asignarAuxiliar.bind(this));
    this.router.delete("/clase/:id/auxiliar/:id_usuario", this.validar, this.requerirRol("Administrador","Auxiliar","Docente"), this.desasignarAuxiliar.bind(this));
    this.router.post("/clase/:id/material", this.validar, this.requerirRol("Docente", "Administrador","Auxiliar"), this.asignarMaterial.bind(this));
    this.router.delete("/material/:id_material", this.validar, this.requerirRol("Docente", "Administrador","Auxiliar"), this.desasignarMaterial.bind(this));
    this.router.post("/clase/:id/tema", this.validar, this.requerirRol("Docente", "Administrador","Auxiliar"), this.asignarTema.bind(this));
    this.router.delete("/clase/:id/tema/:id_tema", this.validar, this.requerirRol("Docente", "Administrador","Auxiliar"), this.desasignarTema.bind(this));
    this.router.post("/clases/batch", this.validar, this.requerirRol("Docente", "Administrador","Auxiliar"), this.cargaMasivaClases.bind(this));

    this.router.get("/unidades", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.unidades.bind(this));
    this.router.post("/unidad", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar" ), this.crearUnidad.bind(this));
    this.router.patch("/unidad/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarUnidad.bind(this));
    this.router.delete("/unidad/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarUnidad.bind(this));

    this.router.get("/temas", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.temas.bind(this));
    this.router.post("/tema", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearTema.bind(this));
    this.router.patch("/tema/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarTema.bind(this));
    this.router.delete("/tema/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarTema.bind(this));

    // HeinzGomez - rutas de segmentación por capítulos
    this.router.get("/clase/:id/capitulos", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarCapitulos.bind(this));
    this.router.post("/clase/:id/capitulo", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.crearCapitulo.bind(this));
    this.router.patch("/capitulo/:id_capitulo", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.editarCapitulo.bind(this));
    this.router.delete("/capitulo/:id_capitulo", this.validar, this.requerirRol("Docente", "Auxiliar", "Administrador"), this.eliminarCapitulo.bind(this));

    // Playlists
    this.router.get("/playlists/usuario/:id_usuario", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarPlaylistsUsuario.bind(this));
    this.router.get("/playlists/hash/:share_token", this.consultarPlaylistPorHash.bind(this));
    this.router.get("/playlists/:id_playlist/videos", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.consultarVideosPlaylist.bind(this));
    this.router.get("/playlists/hash/:share_token/videos", this.consultarVideosPlaylistPorHash.bind(this));
    this.router.post("/playlists", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.crearPlaylist.bind(this));
    this.router.delete("/playlists/:id_playlist", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.eliminarPlaylist.bind(this));
    this.router.put("/playlists/:id_playlist/visibilidad", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.cambiarVisibilidadPlaylist.bind(this));
    this.router.post("/playlists/:id_playlist/videos", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.agregarVideoPlaylist.bind(this));
    this.router.delete("/playlists/videos/:id_playlist_clases", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.eliminarVideoPlaylist.bind(this));
    this.router.post("/playlists/:id_playlist/link", this.validar, this.requerirRol("Estudiante", "Docente", "Auxiliar", "Administrador"), this.generarLinkPlaylist.bind(this));

    this.router.get("/audit", this.validar, this.requerirRol("Administrador"), this.consultarAudit.bind(this));
  }

  async catalogoClases(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarCatalogoClases({
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async busquedaAvanzada(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.busquedaAvanzada({
        anio: Number(req.query.anio ?? 0),
        semestre: Number(req.query.semestre ?? 0),
        id_area: Number(req.query.id_area ?? 0),
        id_curso: Number(req.query.id_curso ?? 0),
        id_docente: Number(req.query.id_docente ?? 0),
        id_tema: Number(req.query.id_tema ?? 0),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async detalleClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.obtenerDetalleClaseGrabada({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async enlaceClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.obtenerEnlaceClaseGrabada({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async participantesClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarParticipantesClase({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async crearClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.crearClaseGrabada({
        id_curso: req.body.id_curso,
        id_periodo: req.body.id_periodo,
        id_area: req.body.id_area,
        titulo: req.body.titulo,
        fecha_impartida: req.body.fecha_impartida,
        duracion_min: req.body.duracion_min,
        descripcion: req.body.descripcion ?? "",
        url_video: req.body.url_video ?? "",
        anio: req.body.anio,
        num_semestre: req.body.num_semestre,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async editarClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.editarClaseGrabada({
        id_clase: Number(req.params.id),
        id_curso: req.body.id_curso,
        id_periodo: req.body.id_periodo,
        id_area: req.body.id_area,
        titulo: req.body.titulo,
        fecha_impartida: req.body.fecha_impartida,
        duracion_min: req.body.duracion_min,
        descripcion: req.body.descripcion ?? "",
        url_video: req.body.url_video ?? "",
        anio: req.body.anio,
        num_semestre: req.body.num_semestre,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarClase(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarClaseGrabada({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async asignarDocente(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.asignarDocente({
        id_clase: Number(req.params.id),
        id_usuario: req.body.id_usuario,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async asignarAuxiliar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.asignarAuxiliar({
        id_clase: Number(req.params.id),
        id_usuario: req.body.id_usuario,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async asignarMaterial(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.asignarMaterialApoyo({
        id_clase: Number(req.params.id),
        nombre: req.body.nombre,
        tipo: req.body.tipo ?? "",
        url: req.body.url ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async asignarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.asignarTemaClaseGrabada({
        id_clase: Number(req.params.id),
        id_tema: req.body.id_tema,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async cargaMasivaClases(req: Request, res: Response): Promise<void> {
    try {
      // Expect body to be an array of clase objects: [{...}, {...}]
      const payload = { clases: Array.isArray(req.body) ? req.body : [] };
      const result = await this.grabClient.cargaMasivaClases(payload as any);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async desasignarDocente(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.desasignarDocente({
        id_clase: Number(req.params.id),
        id_usuario: Number(req.params.id_usuario),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async desasignarAuxiliar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.desasignarAuxiliar({
        id_clase: Number(req.params.id),
        id_usuario: Number(req.params.id_usuario),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async desasignarMaterial(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.desasignarMaterialApoyo({
        id_material: Number(req.params.id_material),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async desasignarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.desasignarTemaClaseGrabada({
        id_clase: Number(req.params.id),
        id_tema: Number(req.params.id_tema),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async unidades(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarUnidades({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async crearUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.crearUnidad({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async editarUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.editarUnidad({
        id_unidad: Number(req.params.id),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarUnidad(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarUnidad({
        id_unidad: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async temas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarTemas({
        id_unidad: Number(req.query.id_unidad ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async crearTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.crearTema({
        id_unidad: req.body.id_unidad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async editarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.editarTema({
        id_tema: Number(req.params.id),
        id_unidad: req.body.id_unidad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarTema(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarTema({
        id_tema: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  // HeinzGomez - handlers de segmentación por capítulos
  async consultarCapitulos(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarCapitulosClase({
        id_clase: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async crearCapitulo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.crearCapitulo({
        id_clase: Number(req.params.id),
        titulo: req.body.titulo,
        tiempo_inicio: Number(req.body.tiempo_inicio),
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async editarCapitulo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.editarCapitulo({
        id_capitulo: Number(req.params.id_capitulo),
        titulo: req.body.titulo,
        tiempo_inicio: Number(req.body.tiempo_inicio),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarCapitulo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarCapitulo({
        id_capitulo: Number(req.params.id_capitulo),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async consultarAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarAuditLogs({
        pagina: Number(req.query.pagina ?? 1),
        usuario_filtro: Number(req.query.usuario_filtro ?? 0),
        tabla_filtro: String(req.query.tabla_filtro ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async consultarPlaylistsUsuario(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarPlaylistsUsuario({
        id_usuario: Number(req.params.id_usuario),
        pagina: Number(req.query.pagina ?? 1),
        ordenar_por: String(req.query.ordenar_por ?? "fecha_creacion"),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async consultarPlaylistPorHash(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarPlaylistPorHash({
        share_token: req.params.share_token,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async consultarVideosPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarVideosPlaylist({
        id_playlist: Number(req.params.id_playlist),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async consultarVideosPlaylistPorHash(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.consultarVideosPlaylistPorHash({
        share_token: req.params.share_token,
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async crearPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.crearPlaylist({
        id_usuario: this.idUsuarioSesion(req),
        titulo: req.body.titulo,
        descripcion: req.body.descripcion ?? "",
        visibilidad: req.body.visibilidad ?? "Privada",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarPlaylist({
        id_playlist: Number(req.params.id_playlist),
        id_usuario: this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async cambiarVisibilidadPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.cambiarVisibilidadPlaylist({
        id_playlist: Number(req.params.id_playlist),
        id_usuario: this.idUsuarioSesion(req),
        visibilidad: req.body.visibilidad,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async agregarVideoPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.agregarVideoPlaylist({
        id_playlist: Number(req.params.id_playlist),
        id_clase: req.body.id_clase,
        tiempo_inicio: req.body.tiempo_inicio,
        tiempo_final: req.body.tiempo_final,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async eliminarVideoPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.eliminarVideoPlaylist({
        id_playlist_clases: Number(req.params.id_playlist_clases),
        id_usuario: this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }

  async generarLinkPlaylist(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.grabClient.generarLinkPlaylist({
        id_playlist: Number(req.params.id_playlist),
        id_usuario: this.idUsuarioSesion(req),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "grabaciones");
    }
  }
}
