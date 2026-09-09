package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresCapituloRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestCapituloRepo_CrearCapitulo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	mock.ExpectExec("CALL sp_registrar_capitulo").WillReturnResult(sqlmock.NewResult(0, 0))
	rows := sqlmock.NewRows([]string{"id_capitulo", "id_clase", "titulo", "tiempo_inicio"}).
		AddRow(1, 1, "Intro", 0)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: 1, Titulo: "Intro", TiempoInicio: 0})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestCapituloRepo_EditarCapitulo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	rows := sqlmock.NewRows([]string{"id_capitulo", "id_clase", "titulo", "tiempo_inicio"}).
		AddRow(1, 1, "Editado", 30)
	mock.ExpectQuery("UPDATE capitulo").WillReturnRows(rows)
	result, err := repo.EditarCapitulo(types.EditarCapituloParams{ID: 1, Titulo: "Editado", TiempoInicio: 30})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.Titulo != "Editado" {
		t.Fatalf("esperaba Titulo=Editado, obtuvo %s", result.Titulo)
	}
}

func TestCapituloRepo_EditarCapitulo_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	mock.ExpectQuery("UPDATE capitulo").WillReturnError(sql.ErrNoRows)
	_, err := repo.EditarCapitulo(types.EditarCapituloParams{ID: 99, Titulo: "X", TiempoInicio: 0})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestCapituloRepo_EliminarCapitulo_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	mock.ExpectExec("DELETE FROM capitulo").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarCapitulo(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestCapituloRepo_EliminarCapitulo_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	mock.ExpectExec("DELETE FROM capitulo").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarCapitulo(99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestCapituloRepo_BuscarCapituloPorId(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	rows := sqlmock.NewRows([]string{"id_capitulo", "id_clase", "titulo", "tiempo_inicio"}).
		AddRow(1, 1, "Intro", 0)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BuscarCapituloPorId(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestCapituloRepo_ConsultarCapitulosClase(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	rows := sqlmock.NewRows([]string{"id_capitulo", "id_clase", "titulo", "tiempo_inicio"}).
		AddRow(1, 1, "Intro", 0).AddRow(2, 1, "Desarrollo", 120)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarCapitulosClase(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("esperaba 2, obtuvo %d", len(result))
	}
}

func TestCapituloRepo_ExisteTiempoEnClase(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresCapituloRepository(db)
	rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
	mock.ExpectQuery("SELECT EXISTS").WillReturnRows(rows)
	existe, err := repo.ExisteTiempoEnClase(1, 60, 0)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !existe {
		t.Fatal("esperaba existe=true")
	}
}
