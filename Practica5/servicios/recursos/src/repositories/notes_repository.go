package repositories

import (
	"database/sql"

	"servicio_recursos/types"
)

type NotesRepository interface {
	ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error)
	CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error)
	ActualizarApunte(idApunte int32, titulo, contenido string) error
	AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error)
	EliminarMarcadorTiempo(idMarcador int32) error
}

type PostgresNotesRepository struct {
	db *sql.DB
}

func NewPostgresNotesRepository(db *sql.DB) *PostgresNotesRepository {
	return &PostgresNotesRepository{db: db}
}

func (r *PostgresNotesRepository) ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error) {
	var apunte types.ApunteInfo

	err := r.db.QueryRow(
		`SELECT id_apunte, id_clase, id_usuario, titulo, COALESCE(contenido_markdown, ''),
		        to_char(fecha_creacion, 'YYYY-MM-DD HH24:MI:SS'),
		        to_char(fecha_actualizacion, 'YYYY-MM-DD HH24:MI:SS')
		 FROM Apuntes
		 WHERE id_clase = $1 AND id_usuario = $2`,
		idClase, idUsuario,
	).Scan(&apunte.IDApunte, &apunte.IDClase, &apunte.IDUsuario, &apunte.Titulo,
		&apunte.ContenidoMarkdown, &apunte.FechaCreacion, &apunte.FechaActualizacion)
	if err != nil {
		return apunte, err
	}

	rows, err := r.db.Query(
		`SELECT id_marcador, segundo, COALESCE(texto, '')
		 FROM Marcador_Tiempo
		 WHERE id_apunte = $1
		 ORDER BY segundo`,
		apunte.IDApunte,
	)
	if err != nil {
		return apunte, err
	}
	defer rows.Close()

	apunte.Marcadores = make([]types.MarcadorTiempo, 0)
	for rows.Next() {
		var m types.MarcadorTiempo
		if err := rows.Scan(&m.IDMarcador, &m.Segundo, &m.Texto); err != nil {
			return apunte, err
		}
		apunte.Marcadores = append(apunte.Marcadores, m)
	}
	return apunte, rows.Err()
}

func (r *PostgresNotesRepository) CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO Apuntes (id_clase, id_usuario, titulo, contenido_markdown)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id_apunte`,
		idClase, idUsuario, titulo, strToNil(contenido),
	).Scan(&id)
	return id, err
}

func (r *PostgresNotesRepository) ActualizarApunte(idApunte int32, titulo, contenido string) error {
	_, err := r.db.Exec(
		`UPDATE Apuntes
		 SET titulo = $1, contenido_markdown = $2, fecha_actualizacion = CURRENT_TIMESTAMP
		 WHERE id_apunte = $3`,
		titulo, strToNil(contenido), idApunte,
	)
	return err
}

func (r *PostgresNotesRepository) AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO Marcador_Tiempo (id_apunte, segundo, texto)
		 VALUES ($1, $2, $3)
		 RETURNING id_marcador`,
		idApunte, segundo, strToNil(texto),
	).Scan(&id)
	return id, err
}

func (r *PostgresNotesRepository) EliminarMarcadorTiempo(idMarcador int32) error {
	_, err := r.db.Exec(
		"DELETE FROM Marcador_Tiempo WHERE id_marcador = $1",
		idMarcador,
	)
	return err
}
