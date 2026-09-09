package repositories

import (
	"database/sql"

	"servicio_recursos/types"
)

type ForumRepository interface {
	ConsultarDudasClase(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error)
	CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error)
	CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error)
	MarcarRespuesta(idRespuesta, idUsuario int32) error
}

type PostgresForumRepository struct {
	db *sql.DB
}

func NewPostgresForumRepository(db *sql.DB) *PostgresForumRepository {
	return &PostgresForumRepository{db: db}
}

func (r *PostgresForumRepository) ConsultarDudasClase(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
	var totalPaginas int32

	err := r.db.QueryRow(
		`SELECT CEIL(COUNT(*)::NUMERIC / $2) FROM Dudas WHERE id_clase = $1`,
		idClase, porPagina,
	).Scan(&totalPaginas)
	if err != nil {
		return nil, 0, err
	}

	offset := (pagina - 1) * int32(porPagina)
	rows, err := r.db.Query(
		`SELECT id_dudas, id_clase, id_usuario, duda, segundo,
		        to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS')
		 FROM Dudas
		 WHERE id_clase = $1
		 ORDER BY fecha_creacion DESC
		 LIMIT $2 OFFSET $3`,
		idClase, porPagina, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	dudas := make([]types.DudaInfo, 0)
	for rows.Next() {
		var d types.DudaInfo
		if err := rows.Scan(&d.IDDudas, &d.IDClase, &d.IDUsuario, &d.Duda, &d.Segundo, &d.FechaCreacion); err != nil {
			return nil, 0, err
		}
		dudas = append(dudas, d)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	for i := range dudas {
		respRows, err := r.db.Query(
			`SELECT id_respuesta, id_duda, id_usuario, respuesta, marcada,
			        to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS')
			 FROM Respuestas
			 WHERE id_duda = $1
			 ORDER BY fecha_creacion`,
			dudas[i].IDDudas,
		)
		if err != nil {
			return nil, 0, err
		}
		dudas[i].Respuestas = make([]types.RespuestaInfo, 0)
		for respRows.Next() {
			var resp types.RespuestaInfo
			if err := respRows.Scan(&resp.IDRespuesta, &resp.IDDuda, &resp.IDUsuario,
				&resp.Respuesta, &resp.Marcada, &resp.FechaCreacion); err != nil {
				respRows.Close()
				return nil, 0, err
			}
			dudas[i].Respuestas = append(dudas[i].Respuestas, resp)
		}
		respRows.Close()
		if err := respRows.Err(); err != nil {
			return nil, 0, err
		}
	}

	return dudas, totalPaginas, nil
}

func (r *PostgresForumRepository) CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO Dudas (id_clase, id_usuario, duda, segundo)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id_dudas`,
		idClase, idUsuario, duda, segundo,
	).Scan(&id)
	return id, err
}

func (r *PostgresForumRepository) CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO Respuestas (id_duda, id_usuario, respuesta)
		 VALUES ($1, $2, $3)
		 RETURNING id_respuesta`,
		idDuda, idUsuario, respuesta,
	).Scan(&id)
	return id, err
}

func (r *PostgresForumRepository) MarcarRespuesta(idRespuesta, idUsuario int32) error {
	_, err := r.db.Exec(
		`UPDATE Respuestas SET marcada = TRUE
		 WHERE id_respuesta = $1`,
		idRespuesta,
	)
	return err
}
