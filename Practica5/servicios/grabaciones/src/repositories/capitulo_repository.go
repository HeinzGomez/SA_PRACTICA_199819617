// HeinzGomez - Repositorio Postgres de capítulos (create vía SP, resto por SQL parametrizado)
package repositories

import (
	"database/sql"

	"servicio-grabaciones/types"
)

type CapituloRepository interface {
	CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error)
	EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error)
	EliminarCapitulo(idCapitulo int32) error
	BuscarCapituloPorId(idCapitulo int32) (types.Capitulo, error)
	ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error)
	ExisteTiempoEnClase(idClase int32, tiempoInicio int32, exceptoID int32) (bool, error)
}

type PostgresCapituloRepository struct {
	db *sql.DB
}

func NewPostgresCapituloRepository(db *sql.DB) *PostgresCapituloRepository {
	return &PostgresCapituloRepository{db: db}
}

const capituloColumns = "id_capitulo, id_clase, titulo, tiempo_inicio"

func (r *PostgresCapituloRepository) CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error) {
	// HeinzGomez - Invocación activa del procedimiento almacenado sp_registrar_capitulo
	if _, err := r.db.Exec(
		"CALL sp_registrar_capitulo($1, $2, $3)",
		params.IDClase, params.Titulo, params.TiempoInicio,
	); err != nil {
		return types.Capitulo{}, err
	}

	var capitulo types.Capitulo
	err := r.db.QueryRow(
		"SELECT "+capituloColumns+" FROM capitulo WHERE id_clase = $1 AND tiempo_inicio = $2",
		params.IDClase, params.TiempoInicio,
	).Scan(&capitulo.ID, &capitulo.IDClase, &capitulo.Titulo, &capitulo.TiempoInicio)
	return capitulo, err
}

func (r *PostgresCapituloRepository) EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error) {
	var capitulo types.Capitulo
	err := r.db.QueryRow(
		"UPDATE capitulo SET titulo = $1, tiempo_inicio = $2 WHERE id_capitulo = $3 RETURNING "+capituloColumns,
		params.Titulo, params.TiempoInicio, params.ID,
	).Scan(&capitulo.ID, &capitulo.IDClase, &capitulo.Titulo, &capitulo.TiempoInicio)
	if err == sql.ErrNoRows {
		return types.Capitulo{}, sql.ErrNoRows
	}
	return capitulo, err
}

func (r *PostgresCapituloRepository) EliminarCapitulo(idCapitulo int32) error {
	result, err := r.db.Exec("DELETE FROM capitulo WHERE id_capitulo = $1", idCapitulo)
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

func (r *PostgresCapituloRepository) BuscarCapituloPorId(idCapitulo int32) (types.Capitulo, error) {
	var capitulo types.Capitulo
	err := r.db.QueryRow(
		"SELECT "+capituloColumns+" FROM capitulo WHERE id_capitulo = $1",
		idCapitulo,
	).Scan(&capitulo.ID, &capitulo.IDClase, &capitulo.Titulo, &capitulo.TiempoInicio)
	return capitulo, err
}

func (r *PostgresCapituloRepository) ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error) {
	// HeinzGomez - Capítulos ordenados por marca de inicio para pintar la barra segmentada del reproductor
	rows, err := r.db.Query(
		"SELECT "+capituloColumns+" FROM capitulo WHERE id_clase = $1 ORDER BY tiempo_inicio",
		idClase,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	capitulos := make([]types.Capitulo, 0)
	for rows.Next() {
		var capitulo types.Capitulo
		if err := rows.Scan(&capitulo.ID, &capitulo.IDClase, &capitulo.Titulo, &capitulo.TiempoInicio); err != nil {
			return nil, err
		}
		capitulos = append(capitulos, capitulo)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return capitulos, nil
}

func (r *PostgresCapituloRepository) ExisteTiempoEnClase(idClase int32, tiempoInicio int32, exceptoID int32) (bool, error) {
	var existe bool
	err := r.db.QueryRow(
		"SELECT EXISTS(SELECT 1 FROM capitulo WHERE id_clase = $1 AND tiempo_inicio = $2 AND id_capitulo <> $3)",
		idClase, tiempoInicio, exceptoID,
	).Scan(&existe)
	return existe, err
}
