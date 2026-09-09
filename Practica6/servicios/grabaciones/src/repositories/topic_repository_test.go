package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresTopicRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestTopicRepo_CrearUnidad(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_unidad", "nombre", "descripcion"}).AddRow(1, "U1", nil)
	mock.ExpectQuery("INSERT INTO unidad").WillReturnRows(rows)
	result, err := repo.CrearUnidad(types.CrearUnidadParams{Nombre: "U1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestTopicRepo_EditarUnidad(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_unidad", "nombre", "descripcion"}).AddRow(1, "Editada", nil)
	mock.ExpectQuery("UPDATE unidad").WillReturnRows(rows)
	result, err := repo.EditarUnidad(types.EditarUnidadParams{ID: 1, Nombre: "Editada"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.Nombre != "Editada" {
		t.Fatalf("esperaba Nombre=Editada, obtuvo %s", result.Nombre)
	}
}

func TestTopicRepo_EditarUnidad_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectQuery("UPDATE unidad").WillReturnError(sql.ErrNoRows)
	_, err := repo.EditarUnidad(types.EditarUnidadParams{ID: 99, Nombre: "X"})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestTopicRepo_EliminarUnidad_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectExec("DELETE FROM unidad").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarUnidad(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestTopicRepo_EliminarUnidad_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectExec("DELETE FROM unidad").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarUnidad(99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestTopicRepo_BuscarUnidadPorId(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_unidad", "nombre", "descripcion"}).AddRow(1, "U1", nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BuscarUnidadPorId(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestTopicRepo_ConsultarUnidades(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_unidad", "nombre", "descripcion"}).
		AddRow(1, "U1", nil).AddRow(2, "U2", nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarUnidades()
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("esperaba 2, obtuvo %d", len(result))
	}
}

func TestTopicRepo_ContarTemasPorUnidad(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"count"}).AddRow(5)
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(rows)
	total, err := repo.ContarTemasPorUnidad(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if total != 5 {
		t.Fatalf("esperaba 5, obtuvo %d", total)
	}
}

func TestTopicRepo_CrearTema(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_tema", "id_unidad", "nombre", "descripcion"}).AddRow(1, 1, "T1", nil)
	mock.ExpectQuery("INSERT INTO tema").WillReturnRows(rows)
	result, err := repo.CrearTema(types.CrearTemaParams{UnidadID: 1, Nombre: "T1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestTopicRepo_EditarTema(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_tema", "id_unidad", "nombre", "descripcion"}).AddRow(1, 1, "Editado", nil)
	mock.ExpectQuery("UPDATE tema").WillReturnRows(rows)
	result, err := repo.EditarTema(types.EditarTemaParams{ID: 1, UnidadID: 1, Nombre: "Editado"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.Nombre != "Editado" {
		t.Fatalf("esperaba Nombre=Editado, obtuvo %s", result.Nombre)
	}
}

func TestTopicRepo_EditarTema_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectQuery("UPDATE tema").WillReturnError(sql.ErrNoRows)
	_, err := repo.EditarTema(types.EditarTemaParams{ID: 99, UnidadID: 1, Nombre: "X"})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestTopicRepo_EliminarTema_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectExec("DELETE FROM tema").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarTema(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestTopicRepo_EliminarTema_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	mock.ExpectExec("DELETE FROM tema").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarTema(99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestTopicRepo_BuscarTemaPorId(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_tema", "id_unidad", "nombre", "descripcion"}).AddRow(1, 1, "T1", nil)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BuscarTemaPorId(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestTopicRepo_ConsultarTemas(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresTopicRepository(db)
	rows := sqlmock.NewRows([]string{"id_tema", "id_unidad", "nombre", "descripcion", "unidad"}).
		AddRow(1, 1, "T1", nil, "U1")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarTemas(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(result))
	}
}
