package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestNewPostgresNotesRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestNotesRepo_ConsultarApunte(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	apunteRows := sqlmock.NewRows([]string{"id_apunte", "id_clase", "id_usuario", "titulo",
		"contenido_markdown", "fecha_creacion", "fecha_actualizacion"}).
		AddRow(1, 10, 20, "Apunte 1", "contenido", "2025-01-15 10:00:00", "2025-01-15 10:00:00")
	mock.ExpectQuery("SELECT").WillReturnRows(apunteRows)
	marcadorRows := sqlmock.NewRows([]string{"id_marcador", "segundo", "texto"}).
		AddRow(1, 30, "Marcador 1")
	mock.ExpectQuery("SELECT").WillReturnRows(marcadorRows)
	result, err := repo.ConsultarApunte(10, 20)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDApunte != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.IDApunte)
	}
	if len(result.Marcadores) != 1 {
		t.Fatalf("esperaba 1 marcador, obtuvo %d", len(result.Marcadores))
	}
}

func TestNotesRepo_CrearApunte(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	rows := sqlmock.NewRows([]string{"id_apunte"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO Apuntes").WillReturnRows(rows)
	id, err := repo.CrearApunte(10, 20, "Titulo", "contenido")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestNotesRepo_ActualizarApunte(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	mock.ExpectExec("UPDATE Apuntes").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.ActualizarApunte(1, "Nuevo titulo", "nuevo contenido")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestNotesRepo_AgregarMarcadorTiempo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	rows := sqlmock.NewRows([]string{"id_marcador"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO Marcador_Tiempo").WillReturnRows(rows)
	id, err := repo.AgregarMarcadorTiempo(1, 30, "texto")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestNotesRepo_EliminarMarcadorTiempo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresNotesRepository(db)
	mock.ExpectExec("DELETE FROM Marcador_Tiempo").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarMarcadorTiempo(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}
