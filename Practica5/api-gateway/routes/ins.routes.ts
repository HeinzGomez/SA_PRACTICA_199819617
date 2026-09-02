import { Router, Request, Response } from "express";
import { InscripcionClient } from "../grpc/ins.client";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { RoleMiddleware } from "../middleware/role.middleware";
import { BaseRoutes } from "./base.routes";

export class InsRoutes extends BaseRoutes {
  public readonly router: Router;

  constructor(
    private insClient: InscripcionClient,
    authMiddleware: AuthMiddleware,
    roleMiddleware: RoleMiddleware
  ) {
    super(authMiddleware, roleMiddleware);
    this.router = Router();

    this.router.post("/area", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearArea.bind(this));
    this.router.put("/area", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarArea.bind(this));
    this.router.delete("/area/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarArea.bind(this));
    this.router.get("/areas", this.validar, this.consultarAreas.bind(this));
    this.router.post("/curso", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearCurso.bind(this));
    this.router.put("/curso", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarCurso.bind(this));
    this.router.delete("/curso/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarCurso.bind(this));
    this.router.get("/cursos", this.validar, this.consultarCursos.bind(this));
    this.router.post("/pensum", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearPensum.bind(this));
    this.router.put("/pensum", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarPensum.bind(this));
    this.router.delete("/pensum/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarPensum.bind(this));
    this.router.get("/pensums", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.consultarPensums.bind(this));
    this.router.post("/carrera", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearCarrera.bind(this));
    this.router.put("/carrera", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarCarrera.bind(this));
    this.router.delete("/carrera/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarCarrera.bind(this));
    this.router.get("/carreras", this.consultarCarreras.bind(this));
    this.router.post("/periodo", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.crearPeriodo.bind(this));
    this.router.put("/periodo", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.editarPeriodo.bind(this));
    this.router.delete("/periodo/:id", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.eliminarPeriodo.bind(this));
    this.router.get("/periodos", this.validar, this.requerirRol("Administrador", "Docente", "Auxiliar"), this.consultarPeriodos.bind(this));
    this.router.post("/perfil", this.crearPerfil.bind(this));
    this.router.get("/perfil", this.validar, this.consultarPerfil.bind(this));
    this.router.get("/perfiles", this.validar, this.requerirRol("Administrador"), this.consultarPerfilesEstudiante.bind(this));
    this.router.patch("/perfil", this.validar, this.cambiarPerfil.bind(this));
    this.router.post("/roles/asignar", this.validar, this.requerirRol("Administrador"), this.asignarRol.bind(this));
    this.router.put("/roles/cambiar", this.validar, this.requerirRol("Administrador"), this.cambiarRol.bind(this));
    this.router.delete("/roles/eliminar", this.validar, this.requerirRol("Administrador"), this.eliminarRol.bind(this));
    this.router.get("/roles/comprobar", this.validar, this.requerirRol("Administrador"), this.comprobarRol.bind(this));
    this.router.get("/roles/usuario", this.validar, this.rolesDeUsuario.bind(this));
    this.router.post("/inscribir", this.validar, this.requerirRol("Estudiante"), this.inscribirEstudiante.bind(this));
    this.router.patch(
      "/inscripcion/estado",
      this.validar,
      this.requerirRol("Docente", "Auxiliar", "Administrador"),
      this.actualizarEstadoMatricula.bind(this)
    );
    this.router.get("/cursos-estudiante", this.validar, this.cursosEstudiante.bind(this));
    this.router.get("/inscripciones", this.validar, this.requerirRol("Administrador"), this.consultarTodasInscripciones.bind(this));
    this.router.get("/estados-matricula", this.validar, this.estadosMatricula.bind(this));
    this.router.get("/audit", this.validar, this.requerirRol("Administrador"), this.consultarAudit.bind(this));
  }

  async crearArea(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearArea({
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async editarArea(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.editarArea({
        id_area: Number(req.body.id_area),
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarArea(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarArea({
        id_area: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarAreas(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarAreas({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async crearCurso(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearCurso({
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
        id_area: req.body.id_area,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async editarCurso(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.editarCurso({
        id_curso: Number(req.body.id_curso),
        codigo: req.body.codigo,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
        id_area: Number(req.body.id_area),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarCurso(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarCurso({
        id_curso: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarCursos(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarCursos({
        id_area: Number(req.query.id_area ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async crearPensum(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearPensum({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async editarPensum(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.editarPensum({
        id_pensum: Number(req.body.id_pensum),
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarPensum(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarPensum({
        id_pensum: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarPensums(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarPensums({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async crearCarrera(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearCarrera({
        facultad: req.body.facultad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
        id_pensum: req.body.id_pensum,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async editarCarrera(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.editarCarrera({
        id_carrera: Number(req.body.id_carrera),
        facultad: req.body.facultad,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion ?? "",
        id_pensum: Number(req.body.id_pensum),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarCarrera(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarCarrera({
        id_carrera: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarCarreras(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarCarreras({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async crearPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearPeriodo({
        anio: Number(req.body.anio),
        num_semestre: Number(req.body.num_semestre),
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async editarPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.editarPeriodo({
        id_periodo: Number(req.body.id_periodo),
        anio: Number(req.body.anio),
        num_semestre: Number(req.body.num_semestre),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarPeriodo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarPeriodo({
        id_periodo: Number(req.params.id),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarPeriodos(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarPeriodos({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async crearPerfil(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.crearPerfilAcademico({
        id_usuario: req.body.id_usuario,
        registro_academico: req.body.registro_academico,
        dpi: req.body.dpi,
        fecha_nacimiento: req.body.fecha_nacimiento ?? "",
        telefono: req.body.telefono ?? "",
        id_carrera: req.body.id_carrera,
        direccion: req.body.direccion ?? "",
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarPerfilAcademico({
        id_usuario: Number(req.query.id_usuario ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarPerfilesEstudiante(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarPerfilesEstudiante({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async cambiarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.cambiarPerfilAcademico({
        id_perfil: req.body.id_perfil,
        dpi: req.body.dpi ?? "",
        fecha_nacimiento: req.body.fecha_nacimiento ?? "",
        telefono: req.body.telefono ?? "",
        direccion: req.body.direccion ?? "",
        registro_academico: req.body.registro_academico ?? "",
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async asignarRol(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.asignarRolUsuario({
        id_usuario: req.body.id_usuario,
        id_rol: req.body.id_rol,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async comprobarRol(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.comprobarRolUsuario({
        id_usuario: Number(req.query.id_usuario ?? 0),
        nombre_rol: String(req.query.nombre_rol ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async rolesDeUsuario(req: Request, res: Response): Promise<void> {
    try {
      const idSesion = req.usuario?.id_usuario;
      const idSolicitado = Number(req.query.id_usuario ?? 0);


      if (idSolicitado > 0 && idSolicitado !== idSesion) {
        const resultado = await this.insClient.consultarRolesUsuario({
          id_usuario: idSesion ?? 0,
        });
        const esAdmin = (resultado.roles ?? []).some(
          (rol) => rol.rol.trim().toLowerCase() === "administrador"
        );
        if (!esAdmin) {
          res.status(403).json({
            exito: false,
            mensaje: "No tiene permisos para consultar los roles de otro usuario",
          });
          return;
        }
      }

      const result = await this.insClient.consultarRolesUsuario({
        id_usuario: idSolicitado > 0 ? idSolicitado : (idSesion ?? 0),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async cambiarRol(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.cambiarRolUsuario({
        id_usuario: req.body.id_usuario,
        id_rol_actual: req.body.id_rol_actual,
        id_rol_nuevo: req.body.id_rol_nuevo,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async eliminarRol(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.eliminarRolUsuario({
        id_usuario: Number(req.body.id_usuario),
        id_rol: Number(req.body.id_rol),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async inscribirEstudiante(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.inscribirEstudiante({
        id_usuario: req.body.id_usuario,
        id_curso: req.body.id_curso,
        id_periodo: req.body.id_periodo,
        id_estado_matricula: req.body.id_estado_matricula,
        tipo_inscripcion: req.body.tipo_inscripcion ?? "",
        usuario_responsable: req.usuario!.id_usuario,
      });
      res.status(201).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async actualizarEstadoMatricula(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.actualizarEstadoMatricula({
        id_inscripcion: req.body.id_inscripcion,
        nuevo_estado: req.body.nuevo_estado,
        usuario_responsable: req.usuario!.id_usuario,
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async cursosEstudiante(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarCursosEstudiante({
        id_usuario: Number(req.query.id_usuario ?? 0),
        anio: Number(req.query.anio ?? 0),
        semestre: Number(req.query.semestre ?? 0),
        estado: String(req.query.estado ?? ""),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarTodasInscripciones(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarTodasInscripciones({
        id_curso: Number(req.query.id_curso ?? 0),
        anio: Number(req.query.anio ?? 0),
        semestre: Number(req.query.semestre ?? 0),
        pagina: Number(req.query.pagina ?? 1),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async estadosMatricula(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarEstadosMatricula({});
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }

  async consultarAudit(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.insClient.consultarAuditLogs({
        pagina: Number(req.query.pagina ?? 1),
        usuario_filtro: Number(req.query.usuario_filtro ?? 0),
        tabla_filtro: String(req.query.tabla_filtro ?? ""),
      });
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, "inscripción");
    }
  }
}
