import { Pool } from "pg";
import {
  ActualizarEstadoMatriculaParams,
  ConsultarCursosParams,
  ConsultarCursosResult,
  ConsultarTodasInscripcionesParams,
  ConsultarTodasInscripcionesResult,
  CursoEstudianteRow,
  EstadoMatriculaRow,
  InscribirEstudianteParams,
  InscripcionRow,
  PeriodoRow,
} from "../types/inscripcion.types";

const LIMITE_POR_PAGINA = 10;

export interface InscribirRepository {
  inscribirEstudiante(params: InscribirEstudianteParams): Promise<InscripcionRow>;
  actualizarEstadoMatricula(params: ActualizarEstadoMatriculaParams): Promise<InscripcionRow>;
  buscarInscripcionPorId(idInscripcion: number): Promise<InscripcionRow | null>;
  buscarPeriodoPorId(idPeriodo: number): Promise<PeriodoRow | null>;
  buscarEstadoMatriculaPorId(idEstado: number): Promise<EstadoMatriculaRow | null>;
  listarEstadosMatricula(): Promise<EstadoMatriculaRow[]>;
  consultarCursosEstudiante(params: ConsultarCursosParams): Promise<ConsultarCursosResult>;
  consultarTodasInscripciones(
    params: ConsultarTodasInscripcionesParams
  ): Promise<ConsultarTodasInscripcionesResult>;
}

export class PostgresInscribirRepository implements InscribirRepository {
  constructor(private pool: Pool) {}

  async inscribirEstudiante(params: InscribirEstudianteParams): Promise<InscripcionRow> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [
        String(params.usuario_responsable),
      ]);
      await client.query("CALL sp_inscribir_estudiante($1, $2, $3, $4, $5)", [
        params.id_usuario,
        params.id_curso,
        params.id_periodo,
        params.id_estado_matricula,
        params.tipo_inscripcion,
      ]);
      await client.query("COMMIT");

      const { rows } = await client.query<InscripcionRow>(
        "SELECT id_inscripcion, id_usuario, id_curso, id_periodo, id_estado_matricula, fecha_inscripcion, tipo_inscripcion FROM inscripcion WHERE id_usuario = $1 AND id_curso = $2 AND id_periodo = $3 ORDER BY fecha_inscripcion DESC LIMIT 1",
        [params.id_usuario, params.id_curso, params.id_periodo]
      );

      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async actualizarEstadoMatricula(
    params: ActualizarEstadoMatriculaParams
  ): Promise<InscripcionRow> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [
        String(params.usuario_responsable),
      ]);
      await client.query("CALL sp_actualizar_estado_matricula($1, $2)", [
        params.id_inscripcion,
        params.nuevo_estado,
      ]);
      await client.query("COMMIT");

      const { rows } = await client.query<InscripcionRow>(
        "SELECT id_inscripcion, id_usuario, id_curso, id_periodo, id_estado_matricula, fecha_inscripcion, tipo_inscripcion FROM inscripcion WHERE id_inscripcion = $1",
        [params.id_inscripcion]
      );

      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async buscarInscripcionPorId(idInscripcion: number): Promise<InscripcionRow | null> {
    const { rows } = await this.pool.query<InscripcionRow>(
      "SELECT id_inscripcion, id_usuario, id_curso, id_periodo, id_estado_matricula, fecha_inscripcion, tipo_inscripcion FROM inscripcion WHERE id_inscripcion = $1",
      [idInscripcion]
    );
    return rows[0] ?? null;
  }

  async buscarPeriodoPorId(idPeriodo: number): Promise<PeriodoRow | null> {
    const { rows } = await this.pool.query<PeriodoRow>(
      "SELECT id_periodo, anio, num_semestre FROM periodo WHERE id_periodo = $1",
      [idPeriodo]
    );
    return rows[0] ?? null;
  }

  async buscarEstadoMatriculaPorId(idEstado: number): Promise<EstadoMatriculaRow | null> {
    const { rows } = await this.pool.query<EstadoMatriculaRow>(
      "SELECT id_estado, codigo, nombre, descripcion FROM estado_matricula WHERE id_estado = $1",
      [idEstado]
    );
    return rows[0] ?? null;
  }

  async listarEstadosMatricula(): Promise<EstadoMatriculaRow[]> {
    const { rows } = await this.pool.query<EstadoMatriculaRow>(
      "SELECT id_estado, codigo, nombre, descripcion FROM estado_matricula ORDER BY id_estado"
    );
    return rows;
  }

  async consultarCursosEstudiante(params: ConsultarCursosParams): Promise<ConsultarCursosResult> {
    const condiciones =
      "id_usuario = $1 AND ($2 = 0 OR anio = $2) AND ($3 = 0 OR semestre = $3) AND ($4 = '' OR LOWER(codigo_estado) = LOWER($4) OR LOWER(estado_matricula) = LOWER($4))";
    const valores = [params.id_usuario, params.anio, params.semestre, params.estado];

    const { rows: conteo } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM vw_cursos_estudiante WHERE ${condiciones}`,
      valores
    );

    const total = Number(conteo[0]?.total ?? 0);
    const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA));
    const pagina = Math.min(Math.max(params.pagina, 1), totalPaginas);
    const offset = (pagina - 1) * LIMITE_POR_PAGINA;

    const { rows } = await this.pool.query<CursoEstudianteRow>(
      `SELECT id_inscripcion, id_usuario, id_curso, codigo_curso, curso, codigo_area, area, anio, semestre, codigo_estado, estado_matricula, tipo_inscripcion, fecha_inscripcion FROM vw_cursos_estudiante WHERE ${condiciones} ORDER BY fecha_inscripcion DESC LIMIT ${LIMITE_POR_PAGINA} OFFSET ${offset}`,
      valores
    );

    return { registros: rows, total_paginas: totalPaginas };
  }

  async consultarTodasInscripciones(
    params: ConsultarTodasInscripcionesParams
  ): Promise<ConsultarTodasInscripcionesResult> {
    const condiciones =
      "($1 = 0 OR id_curso = $1) AND ($2 = 0 OR anio = $2) AND ($3 = 0 OR semestre = $3)";
    const valores = [params.id_curso, params.anio, params.semestre];

    const { rows: conteo } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM vw_cursos_estudiante WHERE ${condiciones}`,
      valores
    );

    const total = Number(conteo[0]?.total ?? 0);
    const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA));
    const pagina = Math.min(Math.max(params.pagina, 1), totalPaginas);
    const offset = (pagina - 1) * LIMITE_POR_PAGINA;

    const { rows } = await this.pool.query<CursoEstudianteRow>(
      `SELECT id_inscripcion, id_usuario, id_curso, codigo_curso, curso, codigo_area, area, anio, semestre, codigo_estado, estado_matricula, tipo_inscripcion, fecha_inscripcion FROM vw_cursos_estudiante WHERE ${condiciones} ORDER BY fecha_inscripcion DESC LIMIT ${LIMITE_POR_PAGINA} OFFSET ${offset}`,
      valores
    );

    return { registros: rows, total_paginas: totalPaginas };
  }
}
