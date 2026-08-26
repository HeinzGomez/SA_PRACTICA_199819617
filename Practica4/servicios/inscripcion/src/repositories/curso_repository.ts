import { Pool } from "pg";
import {
  AreaRow,
  CrearAreaParams,
  EditarAreaParams,
  CrearCursoParams,
  EditarCursoParams,
  CursoRow,
  ListarCursosParams,
} from "../types/curso.types";

export interface CursoRepository {
  crearArea(params: CrearAreaParams): Promise<AreaRow>;
  editarArea(params: EditarAreaParams): Promise<AreaRow | null>;
  eliminarArea(idArea: number): Promise<boolean>;
  buscarAreaPorCodigo(codigo: string): Promise<AreaRow | null>;
  buscarAreaPorId(idArea: number): Promise<AreaRow | null>;
  listarAreas(): Promise<AreaRow[]>;
  crearCurso(params: CrearCursoParams): Promise<CursoRow>;
  editarCurso(params: EditarCursoParams): Promise<CursoRow | null>;
  eliminarCurso(idCurso: number): Promise<boolean>;
  buscarCursoPorCodigo(codigo: string): Promise<CursoRow | null>;
  buscarCursoPorId(idCurso: number): Promise<CursoRow | null>;
  listarCursos(params?: ListarCursosParams): Promise<CursoRow[]>;
}

export class PostgresCursoRepository implements CursoRepository {
  constructor(private pool: Pool) {}

  async crearArea(params: CrearAreaParams): Promise<AreaRow> {
    const { rows } = await this.pool.query<AreaRow>(
      "INSERT INTO area (codigo, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id_area, codigo, nombre, descripcion",
      [params.codigo, params.nombre, params.descripcion]
    );
    return rows[0];
  }

  async editarArea(params: EditarAreaParams): Promise<AreaRow | null> {
    const { rows } = await this.pool.query<AreaRow>(
      "UPDATE area SET codigo = $2, nombre = $3, descripcion = $4 WHERE id_area = $1 RETURNING id_area, codigo, nombre, descripcion",
      [params.id_area, params.codigo, params.nombre, params.descripcion]
    );
    return rows[0] ?? null;
  }

  async eliminarArea(idArea: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM area WHERE id_area = $1",
      [idArea]
    );
    return (rowCount ?? 0) > 0;
  }

  async buscarAreaPorCodigo(codigo: string): Promise<AreaRow | null> {
    const { rows } = await this.pool.query<AreaRow>(
      "SELECT id_area, codigo, nombre, descripcion FROM area WHERE LOWER(codigo) = LOWER($1)",
      [codigo]
    );
    return rows[0] ?? null;
  }

  async buscarAreaPorId(idArea: number): Promise<AreaRow | null> {
    const { rows } = await this.pool.query<AreaRow>(
      "SELECT id_area, codigo, nombre, descripcion FROM area WHERE id_area = $1",
      [idArea]
    );
    return rows[0] ?? null;
  }

  async listarAreas(): Promise<AreaRow[]> {
    const { rows } = await this.pool.query<AreaRow>(
      "SELECT id_area, codigo, nombre, descripcion FROM area ORDER BY nombre"
    );
    return rows;
  }

  async crearCurso(params: CrearCursoParams): Promise<CursoRow> {
    const { rows } = await this.pool.query<CursoRow>(
      "INSERT INTO curso (codigo, nombre, descripcion, id_area) VALUES ($1, $2, $3, $4) RETURNING id_curso, codigo, nombre, descripcion, id_area, fecha_inscripcion",
      [params.codigo, params.nombre, params.descripcion, params.id_area]
    );
    return rows[0];
  }

  async editarCurso(params: EditarCursoParams): Promise<CursoRow | null> {
    const { rows } = await this.pool.query<CursoRow>(
      "UPDATE curso SET codigo = $2, nombre = $3, descripcion = $4, id_area = $5 WHERE id_curso = $1 RETURNING id_curso, codigo, nombre, descripcion, id_area, fecha_inscripcion",
      [params.id_curso, params.codigo, params.nombre, params.descripcion, params.id_area]
    );
    return rows[0] ?? null;
  }

  async eliminarCurso(idCurso: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "DELETE FROM curso WHERE id_curso = $1",
      [idCurso]
    );
    return (rowCount ?? 0) > 0;
  }

  async buscarCursoPorCodigo(codigo: string): Promise<CursoRow | null> {
    const { rows } = await this.pool.query<CursoRow>(
      "SELECT id_curso, codigo, nombre, descripcion, id_area, fecha_inscripcion FROM curso WHERE LOWER(codigo) = LOWER($1)",
      [codigo]
    );
    return rows[0] ?? null;
  }

  async buscarCursoPorId(idCurso: number): Promise<CursoRow | null> {
    const { rows } = await this.pool.query<CursoRow>(
      "SELECT id_curso, codigo, nombre, descripcion, id_area, fecha_inscripcion FROM curso WHERE id_curso = $1",
      [idCurso]
    );
    return rows[0] ?? null;
  }

  async listarCursos(params?: ListarCursosParams): Promise<CursoRow[]> {
    const query =
      "SELECT id_curso, codigo, nombre, descripcion, id_area, fecha_inscripcion FROM curso" +
      (params?.idArea ? " WHERE id_area = $1" : "") +
      " ORDER BY nombre";
    const values = params?.idArea ? [params.idArea] : [];
    const { rows } = await this.pool.query<CursoRow>(query, values);
    return rows;
  }
}
