package repositories

import (
	"database/sql"

	"servicio-grabaciones/types"
)

type AssignRepository interface {
	AsignarDocente(params types.AsignarDocenteParams) error
	AsignarAuxiliar(params types.AsignarAuxiliarParams) error
	AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error)
	AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error
	DesasignarDocente(params types.DesasignarDocenteParams) error
	DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error
	DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error
	DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error
	ConsultarParticipantesClase(idClase int32) ([]types.Participante, error)
}

type PostgresAssignRepository struct {
	db *sql.DB
}

func NewPostgresAssignRepository(db *sql.DB) *PostgresAssignRepository {
	return &PostgresAssignRepository{db: db}
}

func (r *PostgresAssignRepository) AsignarDocente(params types.AsignarDocenteParams) error {
	_, err := r.db.Exec(
		"CALL sp_asignar_docente($1, $2)",
		params.IDClase, params.IDUsuario,
	)
	return err
}

func (r *PostgresAssignRepository) AsignarAuxiliar(params types.AsignarAuxiliarParams) error {
	_, err := r.db.Exec(
		"CALL sp_asignar_auxiliar($1, $2)",
		params.IDClase, params.IDUsuario,
	)
	return err
}

func (r *PostgresAssignRepository) AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return types.MaterialApoyo{}, err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(
		"CALL sp_agregar_material($1, $2, $3, $4)",
		params.IDClase, params.Nombre, params.Tipo, params.URL,
	); err != nil {
		return types.MaterialApoyo{}, err
	}

	var idMaterial int32

	if err := tx.QueryRow(
		"SELECT id_material FROM material_apoyo WHERE id_clase = $1 AND nombre = $2 AND tipo = $3 AND url = $4 ORDER BY id_material DESC LIMIT 1",
		params.IDClase, params.Nombre, params.Tipo, params.URL,
	).Scan(&idMaterial); err != nil {
		return types.MaterialApoyo{}, err
	}

	if err := tx.Commit(); err != nil {
		return types.MaterialApoyo{}, err
	}

	var material types.MaterialApoyo
	err = r.db.QueryRow(
		"SELECT id_material, id_clase, nombre, tipo, url FROM material_apoyo WHERE id_material = $1",
		idMaterial,
	).Scan(&material.ID, &material.IDClase, &material.Nombre, &material.Tipo, &material.URL)
	return material, err
}

func (r *PostgresAssignRepository) AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error {
	_, err := r.db.Exec(
		"CALL sp_asignar_tema_clase($1, $2)",
		params.IDClase, params.IDTema,
	)
	return err
}

func (r *PostgresAssignRepository) ConsultarParticipantesClase(idClase int32) ([]types.Participante, error) {
	rows, err := r.db.Query(
		`SELECT id_clase, id_usuario, tipo_participante
		 FROM vw_docentes_auxiliares
		 WHERE id_clase = $1
		 ORDER BY tipo_participante, id_usuario`,
		idClase,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	participantes := make([]types.Participante, 0)
	for rows.Next() {
		var participante types.Participante
		if err := rows.Scan(
			&participante.IDClase, &participante.IDUsuario, &participante.TipoParticipante,
		); err != nil {
			return nil, err
		}
		participantes = append(participantes, participante)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return participantes, nil
}

func (r *PostgresAssignRepository) DesasignarDocente(params types.DesasignarDocenteParams) error {
	res, err := r.db.Exec(
		"DELETE FROM clase_docente WHERE id_clase = $1 AND id_usuario = $2",
		params.IDClase, params.IDUsuario,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return types.NewNotFoundError("La asignación del docente no existe")
	}
	return nil
}

func (r *PostgresAssignRepository) DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error {
	res, err := r.db.Exec(
		"DELETE FROM clase_auxiliar WHERE id_clase = $1 AND id_usuario = $2",
		params.IDClase, params.IDUsuario,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return types.NewNotFoundError("La asignación del auxiliar no existe")
	}
	return nil
}

func (r *PostgresAssignRepository) DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error {
	res, err := r.db.Exec(
		"DELETE FROM material_apoyo WHERE id_material = $1",
		params.IDMaterial,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return types.NewNotFoundError("El material de apoyo no existe")
	}
	return nil
}

func (r *PostgresAssignRepository) DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error {
	res, err := r.db.Exec(
		"DELETE FROM clase_tema WHERE id_clase = $1 AND id_tema = $2",
		params.IDClase, params.IDTema,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return types.NewNotFoundError("La asignación del tema no existe")
	}
	return nil
}
