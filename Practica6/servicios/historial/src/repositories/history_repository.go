package repositories

import (
	"database/sql"

	"servicio-historial/types"
)

const historialPageSize = 10

const historialColumns = `id_historial, id_usuario, id_clase, id_tema, minuto_actual,
	segundo_actual, duracion_total, porcentaje_visto,
	to_char(fecha_ultima_reproduccion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_ultima_reproduccion,
	to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
	to_char(fecha_actualizacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_actualizacion,
	completada`

type HistoryRepository interface {
	RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error)
	ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error)
	MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error)
	ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error)
	ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error)
	ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error)
	EliminarHistorialClase(params types.EliminarHistorialParams) error
}

type PostgresHistoryRepository struct {
	db *sql.DB
}

func NewPostgresHistoryRepository(db *sql.DB) *PostgresHistoryRepository {
	return &PostgresHistoryRepository{db: db}
}

func (r *PostgresHistoryRepository) RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
	if _, err := r.db.Exec(
		"CALL sp_registrar_progreso($1, $2, $3, $4, $5, $6)",
		params.IDUsuario, params.IDClase, params.IDTema,
		params.MinutoActual, params.SegundoActual, params.DuracionTotal,
	); err != nil {
		return types.HistorialReproduccion{}, err
	}

	return r.BuscarHistorialPorUsuarioClase(params.IDUsuario, params.IDClase)
}

func (r *PostgresHistoryRepository) ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
	if _, err := r.db.Exec(
		"CALL sp_actualizar_checkpoint($1, $2, $3, $4, $5)",
		params.IDUsuario, params.IDClase, params.IDTema, params.MinutoActual, params.SegundoActual,
	); err != nil {
		return types.CheckpointClase{}, err
	}

	return r.ObtenerCheckpointClase(params.IDUsuario, params.IDClase)
}

func (r *PostgresHistoryRepository) MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error) {
	if _, err := r.db.Exec(
		"CALL sp_marcar_completada($1, $2)",
		idUsuario, idClase,
	); err != nil {
		return types.HistorialReproduccion{}, err
	}

	return r.BuscarHistorialPorUsuarioClase(idUsuario, idClase)
}

func (r *PostgresHistoryRepository) ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error) {
	var checkpoint types.CheckpointClase
	err := r.db.QueryRow(
		`SELECT c.id_tema, c.minuto_actual, c.segundo_actual, c.porcentaje_visto, c.completada,
		        to_char(c.fecha_ultima_reproduccion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_ultima_reproduccion
		 FROM fn_obtener_checkpoint($1, $2) c`,
		idUsuario, idClase,
	).Scan(
		&checkpoint.IDTema, &checkpoint.MinutoActual, &checkpoint.SegundoActual,
		&checkpoint.PorcentajeVisto, &checkpoint.Completada, &checkpoint.FechaUltimaReproduccion,
	)
	if err == sql.ErrNoRows {
		return types.CheckpointClase{}, err
	}
	return checkpoint, err
}

func (r *PostgresHistoryRepository) ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
	offset := (params.Pagina - 1) * historialPageSize

	rows, err := r.db.Query(
		`SELECT `+historialColumns+`
		 FROM vw_historial_reproduccion
		 WHERE id_usuario = $1
		 ORDER BY fecha_ultima_reproduccion DESC
		 LIMIT $2 OFFSET $3`,
		params.IDUsuario, historialPageSize, offset,
	)
	if err != nil {
		return types.ConsultarHistorialResult{}, err
	}
	defer rows.Close()

	registros := make([]types.HistorialReproduccion, 0)
	for rows.Next() {
		registro, err := scanHistorial(rows)
		if err != nil {
			return types.ConsultarHistorialResult{}, err
		}
		registros = append(registros, registro)
	}
	if err := rows.Err(); err != nil {
		return types.ConsultarHistorialResult{}, err
	}

	var totalPaginas int32
	if err := r.db.QueryRow(
		`SELECT CEIL(COUNT(*)::numeric / $1)::int
		 FROM vw_historial_reproduccion
		 WHERE id_usuario = $2`,
		historialPageSize, params.IDUsuario,
	).Scan(&totalPaginas); err != nil {
		return types.ConsultarHistorialResult{}, err
	}

	return types.ConsultarHistorialResult{
		Registros:    registros,
		TotalPaginas: totalPaginas,
	}, nil
}

func (r *PostgresHistoryRepository) ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error) {
	var estadisticas types.EstadisticasUsuario
	err := r.db.QueryRow(
		`SELECT COUNT(*)::int,
		        COALESCE(SUM(CASE WHEN completada THEN 1 ELSE 0 END), 0)::int,
		        COALESCE(AVG(porcentaje_visto), 0),
		        COALESCE(SUM(minuto_actual), 0)::int
		 FROM historial_reproduccion
		 WHERE id_usuario = $1`,
		idUsuario,
	).Scan(
		&estadisticas.TotalClases, &estadisticas.ClasesCompletadas,
		&estadisticas.PorcentajePromedio, &estadisticas.MinutosVistos,
	)
	return estadisticas, err
}

func (r *PostgresHistoryRepository) EliminarHistorialClase(params types.EliminarHistorialParams) error {
	result, err := r.db.Exec(
		"DELETE FROM historial_reproduccion WHERE id_usuario = $1 AND id_clase = $2",
		params.IDUsuario, params.IDClase,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PostgresHistoryRepository) BuscarHistorialPorUsuarioClase(idUsuario, idClase int32) (types.HistorialReproduccion, error) {
	var registro types.HistorialReproduccion
	err := r.db.QueryRow(
		`SELECT `+historialColumns+`
		 FROM vw_historial_reproduccion
		 WHERE id_usuario = $1 AND id_clase = $2`,
		idUsuario, idClase,
	).Scan(
		&registro.IDHistorial, &registro.IDUsuario, &registro.IDClase, &registro.IDTema,
		&registro.MinutoActual, &registro.SegundoActual, &registro.DuracionTotal,
		&registro.PorcentajeVisto,
		&registro.FechaUltimaReproduccion, &registro.FechaCreacion,
		&registro.FechaActualizacion, &registro.Completada,
	)
	return registro, err
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanHistorial(row rowScanner) (types.HistorialReproduccion, error) {
	var registro types.HistorialReproduccion
	err := row.Scan(
		&registro.IDHistorial, &registro.IDUsuario, &registro.IDClase, &registro.IDTema,
		&registro.MinutoActual, &registro.SegundoActual, &registro.DuracionTotal,
		&registro.PorcentajeVisto,
		&registro.FechaUltimaReproduccion, &registro.FechaCreacion,
		&registro.FechaActualizacion, &registro.Completada,
	)
	return registro, err
}
