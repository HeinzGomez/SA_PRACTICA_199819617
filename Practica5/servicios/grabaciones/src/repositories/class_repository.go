package repositories

import (
	"database/sql"

	"servicio-grabaciones/types"
)

type ClassRepository interface {
	CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error)
	EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error)
	EliminarClaseGrabada(idClase int32) error
	BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error)
	ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error)
	BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error)
	ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error)
	ObtenerEnlaceClaseGrabada(idClase int32) (string, error)
	CargaMasivaClases(pClasesJSON string) (string, error)
}

type PostgresClassRepository struct {
	db *sql.DB
}

func NewPostgresClassRepository(db *sql.DB) *PostgresClassRepository {
	return &PostgresClassRepository{db: db}
}

const claseColumns = `id_clase, id_curso, id_periodo, id_area, titulo,
	to_char(fecha_impartida, 'YYYY-MM-DD HH24:MI:SS') AS fecha_impartida,
	duracio_min, descripcion, url_video, anio, num_semestre`

func (r *PostgresClassRepository) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return types.ClaseGrabada{}, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		"CALL sp_registrar_clase($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
		params.IDCurso, params.IDPeriodo, params.IDArea, params.Titulo,
		params.FechaImpartida, params.DuracionMin, params.Descripcion, params.URLVideo,
		params.Anio, params.NumSemestre,
	); err != nil {
		return types.ClaseGrabada{}, err
	}

	var idClase int32
	if err := tx.QueryRow(
		"SELECT currval(pg_get_serial_sequence('clase_grabada', 'id_clase'))",
	).Scan(&idClase); err != nil {
		return types.ClaseGrabada{}, err
	}

	if err := tx.Commit(); err != nil {
		return types.ClaseGrabada{}, err
	}

	return r.BuscarClaseGrabada(idClase)
}

func (r *PostgresClassRepository) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	var clase types.ClaseGrabada
	err := r.db.QueryRow(
		`UPDATE clase_grabada
		 SET id_curso = $2, id_periodo = $3, id_area = $4, titulo = $5,
		     fecha_impartida = $6, duracio_min = $7, descripcion = $8,
		     url_video = $9, anio = $10, num_semestre = $11
		 WHERE id_clase = $1
		 RETURNING `+claseColumns,
		params.ID, params.IDCurso, params.IDPeriodo, params.IDArea, params.Titulo,
		params.FechaImpartida, params.DuracionMin, params.Descripcion, params.URLVideo,
		params.Anio, params.NumSemestre,
	).Scan(
		&clase.ID, &clase.IDCurso, &clase.IDPeriodo, &clase.IDArea, &clase.Titulo,
		&clase.FechaImpartida, &clase.DuracionMin, &clase.Descripcion, &clase.URLVideo,
		&clase.Anio, &clase.NumSemestre,
	)
	if err == sql.ErrNoRows {
		return types.ClaseGrabada{}, sql.ErrNoRows
	}
	return clase, err
}

func (r *PostgresClassRepository) EliminarClaseGrabada(idClase int32) error {
	result, err := r.db.Exec("DELETE FROM clase_grabada WHERE id_clase = $1", idClase)
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

func (r *PostgresClassRepository) BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error) {
	var clase types.ClaseGrabada
	err := r.db.QueryRow(
		"SELECT "+claseColumns+" FROM clase_grabada WHERE id_clase = $1",
		idClase,
	).Scan(
		&clase.ID, &clase.IDCurso, &clase.IDPeriodo, &clase.IDArea, &clase.Titulo,
		&clase.FechaImpartida, &clase.DuracionMin, &clase.Descripcion, &clase.URLVideo,
		&clase.Anio, &clase.NumSemestre,
	)
	return clase, err
}

func (r *PostgresClassRepository) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	pagina, limite := normalizarPagina(params.Pagina, limitePorPagina)
	var total int32
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM vw_catalogo_clases`).Scan(&total); err != nil {
		return types.CatalogoClasesResult{}, err
	}

	rows, err := r.db.Query(
		`SELECT id_clase, titulo, descripcion,
		        to_char(fecha_impartida, 'YYYY-MM-DD HH24:MI:SS') AS fecha_impartida,
		        duracio_min, url_video, anio, num_semestre, id_curso, id_area, id_periodo
		 FROM vw_catalogo_clases
		 ORDER BY fecha_impartida DESC
		 LIMIT $1 OFFSET $2`,
		limite, (pagina-1)*limite,
	)
	if err != nil {
		return types.CatalogoClasesResult{}, err
	}
	defer rows.Close()

	clases := make([]types.CatalogoClase, 0)
	for rows.Next() {
		var clase types.CatalogoClase
		if err := rows.Scan(
			&clase.ID, &clase.Titulo, &clase.Descripcion, &clase.FechaImpartida,
			&clase.DuracionMin, &clase.URLVideo, &clase.Anio, &clase.NumSemestre,
			&clase.IDCurso, &clase.IDArea, &clase.IDPeriodo,
		); err != nil {
			return types.CatalogoClasesResult{}, err
		}
		clases = append(clases, clase)
	}
	if err := rows.Err(); err != nil {
		return types.CatalogoClasesResult{}, err
	}
	return types.CatalogoClasesResult{
		Registros:    clases,
		TotalPaginas: totalPaginas(total, limite),
	}, nil
}

func (r *PostgresClassRepository) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	pagina, limite := normalizarPagina(filtros.Pagina, limitePorPagina)

	var total int32
	if err := r.db.QueryRow(
		`SELECT COUNT(*) FROM fn_busqueda_avanzada($1, $2, $3, $4, $5, $6) f`,
		nullableInt(filtros.Anio), nullableInt(filtros.Semestre), nullableInt(filtros.IDArea),
		nullableInt(filtros.IDCurso), nullableInt(filtros.IDDocente), nullableInt(filtros.IDTema),
	).Scan(&total); err != nil {
		return types.BusquedaAvanzadaResult{}, err
	}

	rows, err := r.db.Query(
		`SELECT f.id_clase, f.titulo, f.descripcion,
		        to_char(f.fecha_impartida, 'YYYY-MM-DD HH24:MI:SS') AS fecha_impartida,
		        f.duracion, f.url_video, f.anio, f.semestre,
		        f.id_curso, f.id_area, f.id_periodo
		 FROM fn_busqueda_avanzada($1, $2, $3, $4, $5, $6) f
		 ORDER BY f.id_clase
		 LIMIT $7 OFFSET $8`,
		nullableInt(filtros.Anio), nullableInt(filtros.Semestre), nullableInt(filtros.IDArea),
		nullableInt(filtros.IDCurso), nullableInt(filtros.IDDocente), nullableInt(filtros.IDTema),
		limite, (pagina-1)*limite,
	)
	if err != nil {
		return types.BusquedaAvanzadaResult{}, err
	}
	defer rows.Close()

	clases := make([]types.ClaseBusqueda, 0)
	for rows.Next() {
		var clase types.ClaseBusqueda
		if err := rows.Scan(
			&clase.ID, &clase.Titulo, &clase.Descripcion, &clase.FechaImpartida,
			&clase.DuracionMin, &clase.URLVideo, &clase.Anio, &clase.NumSemestre,
			&clase.IDCurso, &clase.IDArea, &clase.IDPeriodo,
		); err != nil {
			return types.BusquedaAvanzadaResult{}, err
		}
		clases = append(clases, clase)
	}
	if err := rows.Err(); err != nil {
		return types.BusquedaAvanzadaResult{}, err
	}
	return types.BusquedaAvanzadaResult{
		Registros:    clases,
		TotalPaginas: totalPaginas(total, limite),
	}, nil
}

func (r *PostgresClassRepository) ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error) {
	rows, err := r.db.Query(
		`SELECT id_clase, titulo, descripcion,
		        to_char(fecha_impartida, 'YYYY-MM-DD HH24:MI:SS') AS fecha_impartida,
		        duracio_min, url_video, id_unidad, unidad, id_tema, tema,
		        id_material, material, tipo, url
		 FROM vw_ficha_tecnica
		 WHERE id_clase = $1
		 ORDER BY id_tema, id_material`,
		idClase,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	fichas := make([]types.FichaTecnicaRow, 0)
	for rows.Next() {
		var fila types.FichaTecnicaRow
		if err := rows.Scan(
			&fila.ClaseID, &fila.Titulo, &fila.Descripcion, &fila.FechaImpartida,
			&fila.DuracionMin, &fila.URLVideo, &fila.UnidadID, &fila.Unidad,
			&fila.TemaID, &fila.Tema, &fila.MaterialID, &fila.Material,
			&fila.Tipo, &fila.MaterialURL,
		); err != nil {
			return nil, err
		}
		fichas = append(fichas, fila)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return fichas, nil
}

func (r *PostgresClassRepository) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) {
	var urlVideo string
	err := r.db.QueryRow(
		"SELECT url_video FROM clase_grabada WHERE id_clase = $1",
		idClase,
	).Scan(&urlVideo)
	return urlVideo, err
}

// CargaMasivaClases ejecuta el procedimiento sp_carga_masiva_clases
// pasando el JSONB con la lista de clases y devuelve el JSON de resultado.
func (r *PostgresClassRepository) CargaMasivaClases(pClasesJSON string) (string, error) {
	// Call the procedure that inserts the data; procedure no longer returns
	// an OUT parameter because the driver doesn't support sql.Out. Return an
	// empty JSON array string so the service unmarshalling remains compatible.
	// Cast the parameter to JSONB to ensure PostgreSQL resolves the procedure
	// signature correctly (avoids `procedure ...(unknown) does not exist`).
	if _, err := r.db.Exec("CALL sp_carga_masiva_clases($1::jsonb)", pClasesJSON); err != nil {
		return "", err
	}
	return "[]", nil
}

func nullableInt(value int32) any {
	if value == 0 {
		return nil
	}
	return value
}

const limitePorPagina int32 = 10

func normalizarPagina(pagina int32, limite int32) (int32, int32) {
	if pagina < 1 {
		pagina = 1
	}
	return pagina, limite
}

func totalPaginas(total int32, limite int32) int32 {
	if total == 0 {
		return 1
	}
	return (total + limite - 1) / limite
}
