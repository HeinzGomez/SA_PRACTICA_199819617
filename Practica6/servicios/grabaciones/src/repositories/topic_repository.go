package repositories

import (
	"database/sql"

	"servicio-grabaciones/types"
)

type TopicRepository interface {
	CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error)
	EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error)
	EliminarUnidad(idUnidad int32) error
	BuscarUnidadPorId(idUnidad int32) (types.Unidad, error)
	ConsultarUnidades() ([]types.Unidad, error)
	ContarTemasPorUnidad(idUnidad int32) (int64, error)
	CrearTema(params types.CrearTemaParams) (types.Tema, error)
	EditarTema(params types.EditarTemaParams) (types.Tema, error)
	EliminarTema(idTema int32) error
	BuscarTemaPorId(idTema int32) (types.Tema, error)
	ConsultarTemas(idUnidad int32) ([]types.Tema, error)
}

type PostgresTopicRepository struct {
	db *sql.DB
}

func NewPostgresTopicRepository(db *sql.DB) *PostgresTopicRepository {
	return &PostgresTopicRepository{db: db}
}

const unidadColumns = "id_unidad, nombre, descripcion"

func (r *PostgresTopicRepository) CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error) {
	var unidad types.Unidad
	err := r.db.QueryRow(
		"INSERT INTO unidad (nombre, descripcion) VALUES ($1, $2) RETURNING "+unidadColumns,
		params.Nombre, params.Descripcion,
	).Scan(&unidad.ID, &unidad.Nombre, &unidad.Descripcion)
	return unidad, err
}

func (r *PostgresTopicRepository) EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error) {
	var unidad types.Unidad
	err := r.db.QueryRow(
		"UPDATE unidad SET nombre = $1, descripcion = $2 WHERE id_unidad = $3 RETURNING "+unidadColumns,
		params.Nombre, params.Descripcion, params.ID,
	).Scan(&unidad.ID, &unidad.Nombre, &unidad.Descripcion)
	if err == sql.ErrNoRows {
		return types.Unidad{}, sql.ErrNoRows
	}
	return unidad, err
}

func (r *PostgresTopicRepository) EliminarUnidad(idUnidad int32) error {
	result, err := r.db.Exec("DELETE FROM unidad WHERE id_unidad = $1", idUnidad)
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

func (r *PostgresTopicRepository) BuscarUnidadPorId(idUnidad int32) (types.Unidad, error) {
	var unidad types.Unidad
	err := r.db.QueryRow(
		"SELECT "+unidadColumns+" FROM unidad WHERE id_unidad = $1",
		idUnidad,
	).Scan(&unidad.ID, &unidad.Nombre, &unidad.Descripcion)
	return unidad, err
}

func (r *PostgresTopicRepository) ConsultarUnidades() ([]types.Unidad, error) {
	rows, err := r.db.Query("SELECT " + unidadColumns + " FROM unidad ORDER BY id_unidad")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	unidades := make([]types.Unidad, 0)
	for rows.Next() {
		var unidad types.Unidad
		if err := rows.Scan(&unidad.ID, &unidad.Nombre, &unidad.Descripcion); err != nil {
			return nil, err
		}
		unidades = append(unidades, unidad)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return unidades, nil
}

func (r *PostgresTopicRepository) ContarTemasPorUnidad(idUnidad int32) (int64, error) {
	var total int64
	err := r.db.QueryRow(
		"SELECT COUNT(*) FROM tema WHERE id_unidad = $1",
		idUnidad,
	).Scan(&total)
	return total, err
}

func (r *PostgresTopicRepository) CrearTema(params types.CrearTemaParams) (types.Tema, error) {
	var tema types.Tema
	err := r.db.QueryRow(
		"INSERT INTO tema (id_unidad, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id_tema, id_unidad, nombre, descripcion",
		params.UnidadID, params.Nombre, params.Descripcion,
	).Scan(&tema.ID, &tema.UnidadID, &tema.Nombre, &tema.Descripcion)
	return tema, err
}

func (r *PostgresTopicRepository) EditarTema(params types.EditarTemaParams) (types.Tema, error) {
	var tema types.Tema
	err := r.db.QueryRow(
		"UPDATE tema SET id_unidad = $1, nombre = $2, descripcion = $3 WHERE id_tema = $4 RETURNING id_tema, id_unidad, nombre, descripcion",
		params.UnidadID, params.Nombre, params.Descripcion, params.ID,
	).Scan(&tema.ID, &tema.UnidadID, &tema.Nombre, &tema.Descripcion)
	if err == sql.ErrNoRows {
		return types.Tema{}, sql.ErrNoRows
	}
	return tema, err
}

func (r *PostgresTopicRepository) EliminarTema(idTema int32) error {
	result, err := r.db.Exec("DELETE FROM tema WHERE id_tema = $1", idTema)
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

func (r *PostgresTopicRepository) BuscarTemaPorId(idTema int32) (types.Tema, error) {
	var tema types.Tema
	err := r.db.QueryRow(
		"SELECT id_tema, id_unidad, nombre, descripcion FROM tema WHERE id_tema = $1",
		idTema,
	).Scan(&tema.ID, &tema.UnidadID, &tema.Nombre, &tema.Descripcion)
	return tema, err
}

func (r *PostgresTopicRepository) ConsultarTemas(idUnidad int32) ([]types.Tema, error) {
	rows, err := r.db.Query(
		`SELECT t.id_tema, t.id_unidad, t.nombre, t.descripcion, u.nombre AS unidad
		 FROM tema t
		 LEFT JOIN unidad u ON t.id_unidad = u.id_unidad
		 WHERE ($1 = 0 OR t.id_unidad = $1)
		 ORDER BY t.id_tema`,
		idUnidad,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	temas := make([]types.Tema, 0)
	for rows.Next() {
		var tema types.Tema
		if err := rows.Scan(&tema.ID, &tema.UnidadID, &tema.Nombre, &tema.Descripcion, &tema.Unidad); err != nil {
			return nil, err
		}
		temas = append(temas, tema)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return temas, nil
}
