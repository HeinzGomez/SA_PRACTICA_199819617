package repositories

import (
	"database/sql"

	"servicio_recursos/types"
)

type RepoRepository interface {
	CrearRepositorio(params types.CrearRepositorioParams) (int32, error)
	AgregarArchivo(params types.AgregarArchivoParams) (int32, error)
	ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error
	ActualizarTag(idVersion int32, tag string) error
	EliminarArchivo(idArchivo int32) error
	ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error)
	ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error)
	ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error)
}

type PostgresRepoRepository struct {
	db *sql.DB
}

func NewPostgresRepoRepository(db *sql.DB) *PostgresRepoRepository {
	return &PostgresRepoRepository{db: db}
}

func (r *PostgresRepoRepository) CrearRepositorio(params types.CrearRepositorioParams) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		"INSERT INTO Repositorio (id_clase, nombre) VALUES ($1, $2) RETURNING id_repositorio",
		params.IDClase, params.Nombre,
	).Scan(&id)
	return id, err
}

func (r *PostgresRepoRepository) AgregarArchivo(params types.AgregarArchivoParams) (int32, error) {
	if _, err := r.db.Exec(
		"CALL sp_agregar_archivo($1, $2, $3, $4, $5)",
		params.IDRepositorio, params.Nombre, params.Link, strToNil(params.Tag), strToNil(params.Hash),
	); err != nil {
		return 0, err
	}

	var idArchivo int32
	err := r.db.QueryRow(
		`SELECT id_archivo FROM Archivos
		 WHERE id_repositorio = $1 AND nombre = $2
		 ORDER BY id_archivo DESC LIMIT 1`,
		params.IDRepositorio, params.Nombre,
	).Scan(&idArchivo)
	return idArchivo, err
}

func (r *PostgresRepoRepository) ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error {
	_, err := r.db.Exec(
		"CALL sp_actualizar_version_archivo($1, $2, $3, $4)",
		params.IDArchivo, params.Link, strToNil(params.Tag), strToNil(params.Hash),
	)
	return err
}

func (r *PostgresRepoRepository) ActualizarTag(idVersion int32, tag string) error {
	_, err := r.db.Exec(
		"UPDATE Version SET tag = $1 WHERE id_version = $2",
		strToNil(tag), idVersion,
	)
	return err
}

func (r *PostgresRepoRepository) EliminarArchivo(idArchivo int32) error {
	_, err := r.db.Exec(
		"CALL sp_eliminar_archivo($1)",
		idArchivo,
	)
	return err
}

func (r *PostgresRepoRepository) ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error) {
	var info types.RepositorioInfo

	rows, err := r.db.Query(
		`SELECT id_repositorio, id_clase, repositorio_nombre, id_archivo, archivo_nombre
		 FROM vw_archivos_por_repositorio
		 WHERE id_clase = $1 AND id_archivo IS NOT NULL
		 ORDER BY archivo_nombre`,
		idClase,
	)
	if err != nil {
		return info, err
	}
	defer rows.Close()

	first := true
	for rows.Next() {
		var idRep, idClase int32
		var nombreRep, nombreArchivo string
		var idArchivo int32
		if err := rows.Scan(&idRep, &idClase, &nombreRep, &idArchivo, &nombreArchivo); err != nil {
			return info, err
		}
		if first {
			info.IDRepositorio = idRep
			info.IDClase = idClase
			info.Nombre = nombreRep
			first = false
		}
		info.Archivos = append(info.Archivos, types.ArchivoRepositorio{
			IDArchivo: idArchivo,
			Nombre:    nombreArchivo,
		})
	}
	if err := rows.Err(); err != nil {
		return info, err
	}

	if info.Archivos == nil {
		info.Archivos = []types.ArchivoRepositorio{}
	}

	return info, nil
}

func (r *PostgresRepoRepository) ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error) {
	rows, err := r.db.Query(
		`SELECT id_version, id_archivo, link, tag,
		        to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
		        hash, latest
		 FROM Version
		 WHERE id_archivo = $1
		 ORDER BY id_version DESC`,
		idArchivo,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	versiones := make([]types.VersionArchivo, 0)
	for rows.Next() {
		var (
			v    types.VersionArchivo
			link sql.NullString
			tag  sql.NullString
			hash sql.NullString
		)
		if err := rows.Scan(&v.IDVersion, &v.IDArchivo, &link, &tag, &v.FechaCreacion, &hash, &v.EsLatest); err != nil {
			return nil, err
		}
		v.Link = link.String
		v.Tag = tag.String
		v.Hash = hash.String
		versiones = append(versiones, v)
	}
	return versiones, rows.Err()
}

func (r *PostgresRepoRepository) ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error) {
	var (
		v    types.VersionArchivo
		link sql.NullString
		tag  sql.NullString
		hash sql.NullString
	)
	err := r.db.QueryRow(
		`SELECT id_version, id_archivo, link, tag,
		        to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
		        hash, latest
		 FROM Version
		 WHERE id_archivo = $1 AND id_version = $2`,
		idArchivo, idVersion,
	).Scan(&v.IDVersion, &v.IDArchivo, &link, &tag, &v.FechaCreacion, &hash, &v.EsLatest)
	if err != nil {
		return v, err
	}
	v.Link = link.String
	v.Tag = tag.String
	v.Hash = hash.String
	return v, nil
}
