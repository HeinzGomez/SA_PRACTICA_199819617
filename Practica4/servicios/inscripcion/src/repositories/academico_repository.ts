import { Pool } from "pg";
import {
  CambiarPerfilAcademicoParams,
  CarreraRow,
  CrearCarreraParams,
  EditarCarreraParams,
  CrearPensumParams,
  EditarPensumParams,
  CrearPeriodoParams,
  EditarPeriodoParams,
  PeriodoRow,
  CrearPerfilAcademicoParams,
  PensumRow,
  PerfilAcademicoRow,
  PerfilEstudianteRow,
} from "../types/academico.types";

export interface AcademicoRepository {
  crearPensum(params: CrearPensumParams): Promise<PensumRow>;
  editarPensum(params: EditarPensumParams): Promise<PensumRow | null>;
  eliminarPensum(idPensum: number): Promise<boolean>;
  buscarPensumPorId(idPensum: number): Promise<PensumRow | null>;
  listarPensums(): Promise<PensumRow[]>;
  crearCarrera(params: CrearCarreraParams): Promise<CarreraRow>;
  editarCarrera(params: EditarCarreraParams): Promise<CarreraRow | null>;
  eliminarCarrera(idCarrera: number): Promise<boolean>;
  buscarCarreraPorId(idCarrera: number): Promise<CarreraRow | null>;
  listarCarreras(): Promise<CarreraRow[]>;
  crearPeriodo(params: CrearPeriodoParams): Promise<PeriodoRow>;
  editarPeriodo(params: EditarPeriodoParams): Promise<PeriodoRow | null>;
  eliminarPeriodo(idPeriodo: number): Promise<boolean>;
  buscarPeriodoPorId(idPeriodo: number): Promise<PeriodoRow | null>;
  listarPeriodos(): Promise<PeriodoRow[]>;
  crearPerfilAcademico(params: CrearPerfilAcademicoParams): Promise<PerfilAcademicoRow>;
  buscarPerfilPorId(idPerfil: number): Promise<PerfilAcademicoRow | null>;
  buscarPerfilPorUsuario(idUsuario: number): Promise<PerfilAcademicoRow | null>;
  buscarPerfilPorRegistroAcademico(registro: string): Promise<PerfilAcademicoRow | null>;
  buscarPerfilPorDpi(dpi: string): Promise<PerfilAcademicoRow | null>;
  cambiarPerfilAcademico(params: CambiarPerfilAcademicoParams): Promise<PerfilAcademicoRow | null>;
  listarPerfilesEstudiante(): Promise<PerfilEstudianteRow[]>;
}

export class PostgresAcademicoRepository implements AcademicoRepository {
  constructor(private pool: Pool) {}

  async crearPensum(params: CrearPensumParams): Promise<PensumRow> {
    const { rows } = await this.pool.query<PensumRow>(
      "INSERT INTO pensum (nombre, descripcion) VALUES ($1, $2) RETURNING id_pensum, nombre, descripcion",
      [params.nombre, params.descripcion]
    );
    return rows[0];
  }

  async editarPensum(params: EditarPensumParams): Promise<PensumRow | null> {
    const { rows } = await this.pool.query<PensumRow>(
      "UPDATE pensum SET nombre = $2, descripcion = $3 WHERE id_pensum = $1 RETURNING id_pensum, nombre, descripcion",
      [params.id_pensum, params.nombre, params.descripcion]
    );
    return rows[0] ?? null;
  }

  async eliminarPensum(idPensum: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM pensum WHERE id_pensum = $1",
      [idPensum]
    );
    return (rowCount ?? 0) > 0;
  }

  async buscarPensumPorId(idPensum: number): Promise<PensumRow | null> {
    const { rows } = await this.pool.query<PensumRow>(
      "SELECT id_pensum, nombre, descripcion FROM pensum WHERE id_pensum = $1",
      [idPensum]
    );
    return rows[0] ?? null;
  }

  async listarPensums(): Promise<PensumRow[]> {
    const { rows } = await this.pool.query<PensumRow>(
      "SELECT id_pensum, nombre, descripcion FROM pensum ORDER BY nombre"
    );
    return rows;
  }

  async crearCarrera(params: CrearCarreraParams): Promise<CarreraRow> {
    const { rows } = await this.pool.query<CarreraRow>(
      "INSERT INTO carrera (facultad, nombre, descripcion, id_pensum) VALUES ($1, $2, $3, $4) RETURNING id_carrera, facultad, nombre, descripcion, id_pensum, fecha_creacion",
      [params.facultad, params.nombre, params.descripcion, params.id_pensum]
    );
    return rows[0];
  }

  async editarCarrera(params: EditarCarreraParams): Promise<CarreraRow | null> {
    const { rows } = await this.pool.query<CarreraRow>(
      "UPDATE carrera SET facultad = $2, nombre = $3, descripcion = $4, id_pensum = $5 WHERE id_carrera = $1 RETURNING id_carrera, facultad, nombre, descripcion, id_pensum, fecha_creacion",
      [params.id_carrera, params.facultad, params.nombre, params.descripcion, params.id_pensum]
    );
    return rows[0] ?? null;
  }

  async eliminarCarrera(idCarrera: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM carrera WHERE id_carrera = $1",
      [idCarrera]
    );
    return (rowCount ?? 0) > 0;
  }

  async buscarCarreraPorId(idCarrera: number): Promise<CarreraRow | null> {
    const { rows } = await this.pool.query<CarreraRow>(
      "SELECT id_carrera, facultad, nombre, descripcion, id_pensum, fecha_creacion FROM carrera WHERE id_carrera = $1",
      [idCarrera]
    );
    return rows[0] ?? null;
  }

  async listarCarreras(): Promise<CarreraRow[]> {
    const { rows } = await this.pool.query<CarreraRow>(
      "SELECT id_carrera, facultad, nombre, descripcion, id_pensum, fecha_creacion FROM carrera ORDER BY nombre"
    );
    return rows;
  }

  async crearPeriodo(params: CrearPeriodoParams): Promise<PeriodoRow> {
    const { rows } = await this.pool.query<PeriodoRow>(
      "INSERT INTO periodo (anio, num_semestre) VALUES ($1, $2) RETURNING id_periodo, anio, num_semestre",
      [params.anio, params.num_semestre]
    );
    return rows[0];
  }

  async editarPeriodo(params: EditarPeriodoParams): Promise<PeriodoRow | null> {
    const { rows } = await this.pool.query<PeriodoRow>(
      "UPDATE periodo SET anio = $2, num_semestre = $3 WHERE id_periodo = $1 RETURNING id_periodo, anio, num_semestre",
      [params.id_periodo, params.anio, params.num_semestre]
    );
    return rows[0] ?? null;
  }

  async eliminarPeriodo(idPeriodo: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM periodo WHERE id_periodo = $1",
      [idPeriodo]
    );
    return (rowCount ?? 0) > 0;
  }

  async buscarPeriodoPorId(idPeriodo: number): Promise<PeriodoRow | null> {
    const { rows } = await this.pool.query<PeriodoRow>(
      "SELECT id_periodo, anio, num_semestre FROM periodo WHERE id_periodo = $1",
      [idPeriodo]
    );
    return rows[0] ?? null;
  }

  async listarPeriodos(): Promise<PeriodoRow[]> {
    const { rows } = await this.pool.query<PeriodoRow>(
      "SELECT id_periodo, anio, num_semestre FROM periodo ORDER BY anio DESC, num_semestre DESC"
    );
    return rows;
  }

  async crearPerfilAcademico(params: CrearPerfilAcademicoParams): Promise<PerfilAcademicoRow> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "INSERT INTO perfil_academico (id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion",
      [
        params.id_usuario,
        params.registro_academico,
        params.dpi,
        params.fecha_nacimiento,
        params.telefono,
        params.id_carrera,
        params.direccion,
      ]
    );
    return rows[0];
  }

  async buscarPerfilPorId(idPerfil: number): Promise<PerfilAcademicoRow | null> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "SELECT id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion FROM perfil_academico WHERE id_perfil = $1",
      [idPerfil]
    );
    return rows[0] ?? null;
  }

  async buscarPerfilPorRegistroAcademico(registro: string): Promise<PerfilAcademicoRow | null> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "SELECT id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion FROM perfil_academico WHERE LOWER(registro_academico) = LOWER($1)",
      [registro]
    );
    return rows[0] ?? null;
  }

  async buscarPerfilPorUsuario(idUsuario: number): Promise<PerfilAcademicoRow | null> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "SELECT id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion FROM perfil_academico WHERE id_usuario = $1",
      [idUsuario]
    );
    return rows[0] ?? null;
  }

  async buscarPerfilPorDpi(dpi: string): Promise<PerfilAcademicoRow | null> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "SELECT id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion FROM perfil_academico WHERE LOWER(dpi) = LOWER($1)",
      [dpi]
    );
    return rows[0] ?? null;
  }

  async cambiarPerfilAcademico(
    params: CambiarPerfilAcademicoParams
  ): Promise<PerfilAcademicoRow | null> {
    const { rows } = await this.pool.query<PerfilAcademicoRow>(
      "UPDATE perfil_academico SET dpi = COALESCE($2, dpi), fecha_nacimiento = COALESCE($3::date, fecha_nacimiento), telefono = COALESCE($4, telefono), direccion = COALESCE($5, direccion), registro_academico = COALESCE($6, registro_academico) WHERE id_perfil = $1 RETURNING id_perfil, id_usuario, registro_academico, dpi, fecha_nacimiento, telefono, id_carrera, direccion",
      [params.id_perfil, params.dpi, params.fecha_nacimiento, params.telefono, params.direccion, params.registro_academico]
    );
    return rows[0] ?? null;
  }

  async listarPerfilesEstudiante(): Promise<PerfilEstudianteRow[]> {
    const { rows } = await this.pool.query<PerfilEstudianteRow>(
      `SELECT p.id_perfil, p.id_usuario, p.registro_academico, p.id_carrera, c.nombre AS carrera, c.facultad
       FROM perfil_academico p
       INNER JOIN carrera c ON c.id_carrera = p.id_carrera
       ORDER BY p.id_usuario`
    );
    return rows;
  }
}
