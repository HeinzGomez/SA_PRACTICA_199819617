import { Pool } from "pg";
import { AuditLogRow, ConsultarParams, ConsultarResult } from "../types/logs.types";

export interface LogsRepository {
  consultar(params: ConsultarParams): Promise<ConsultarResult>;
}

export class PostgresLogsRepository implements LogsRepository {
  constructor(private pool: Pool) {}

  async consultar(params: ConsultarParams): Promise<ConsultarResult> {
    const { pagina, usuarioFiltro, tablaFiltro } = params;

    const [registrosResult, totalResult] = await Promise.all([
      this.pool.query<AuditLogRow>(
        `SELECT
           id_auditoria,
           usuario_responsable,
           operacion,
           tabla_afectada,
           fecha_evento,
           estado_anterior,
           estado_nuevo
         FROM vw_audit_logs_paginados
         WHERE pagina = $1
           AND ($2 = 0 OR usuario_responsable = $2)
           AND ($3 = '' OR tabla_afectada = $3)`,
        [pagina, usuarioFiltro, tablaFiltro]
      ),
      this.pool.query<{ total: number }>(
        `SELECT COALESCE(MAX(pagina), 0) AS total
         FROM vw_audit_logs_paginados
         WHERE ($1 = 0 OR usuario_responsable = $1)
           AND ($2 = '' OR tabla_afectada = $2)`,
        [usuarioFiltro, tablaFiltro]
      ),
    ]);

    return {
      registros: registrosResult.rows,
      totalPaginas: totalResult.rows[0]?.total ?? 0,
    };
  }
}
