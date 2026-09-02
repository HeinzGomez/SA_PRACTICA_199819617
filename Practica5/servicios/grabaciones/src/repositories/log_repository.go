package repositories

import (
	"database/sql"

	"servicio-grabaciones/types"
)

const auditPageSize = 10

type LogRepository interface {
	Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error)
}

type PostgresLogRepository struct {
	db *sql.DB
}

func NewPostgresLogRepository(db *sql.DB) *PostgresLogRepository {
	return &PostgresLogRepository{db: db}
}

func (r *PostgresLogRepository) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	offset := (params.Pagina - 1) * auditPageSize

	rows, err := r.db.Query(
		`SELECT id_auditoria, usuario_responsable, operacion, tabla_afectada,
		        to_char(fecha_evento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_evento,
		        estado_anterior::text, estado_nuevo::text
		 FROM audit_logs
		 WHERE ($1 = 0 OR usuario_responsable = $1)
		   AND ($2 = '' OR tabla_afectada = $2)
		 ORDER BY id_auditoria DESC
		 LIMIT $3 OFFSET $4`,
		params.UsuarioFiltro, params.TablaFiltro, auditPageSize, offset,
	)
	if err != nil {
		return types.ConsultarAuditLogsResult{}, err
	}
	defer rows.Close()

	registros := make([]types.AuditLog, 0)
	for rows.Next() {
		var registro types.AuditLog
		if err := rows.Scan(
			&registro.IDAuditoria, &registro.UsuarioResponsable, &registro.Operacion,
			&registro.TablaAfectada, &registro.FechaEvento,
			&registro.EstadoAnterior, &registro.EstadoNuevo,
		); err != nil {
			return types.ConsultarAuditLogsResult{}, err
		}
		registros = append(registros, registro)
	}
	if err := rows.Err(); err != nil {
		return types.ConsultarAuditLogsResult{}, err
	}

	var totalPaginas int32
	if err := r.db.QueryRow(
		`SELECT CEIL(COUNT(*)::numeric / $1)::int
		 FROM audit_logs
		 WHERE ($2 = 0 OR usuario_responsable = $2)
		   AND ($3 = '' OR tabla_afectada = $3)`,
		auditPageSize, params.UsuarioFiltro, params.TablaFiltro,
	).Scan(&totalPaginas); err != nil {
		return types.ConsultarAuditLogsResult{}, err
	}

	return types.ConsultarAuditLogsResult{
		Registros:    registros,
		TotalPaginas: totalPaginas,
	}, nil
}
