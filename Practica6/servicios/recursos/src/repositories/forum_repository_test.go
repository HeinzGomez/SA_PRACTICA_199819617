package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestNewPostgresForumRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestForumRepo_CrearDuda(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	rows := sqlmock.NewRows([]string{"id_dudas"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO Dudas").WillReturnRows(rows)
	id, err := repo.CrearDuda(10, 20, "Mi duda", int32Ptr(60))
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestForumRepo_CrearDuda_SegundoNil(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	rows := sqlmock.NewRows([]string{"id_dudas"}).AddRow(2)
	mock.ExpectQuery("INSERT INTO Dudas").WillReturnRows(rows)
	id, err := repo.CrearDuda(10, 20, "Duda sin segundo", nil)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 2 {
		t.Fatalf("esperaba ID=2, obtuvo %d", id)
	}
}

func TestForumRepo_CrearRespuesta(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	rows := sqlmock.NewRows([]string{"id_respuesta"}).AddRow(5)
	mock.ExpectQuery("INSERT INTO Respuestas").WillReturnRows(rows)
	id, err := repo.CrearRespuesta(1, 20, "Mi respuesta")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 5 {
		t.Fatalf("esperaba ID=5, obtuvo %d", id)
	}
}

func TestForumRepo_MarcarRespuesta(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	mock.ExpectExec("UPDATE Respuestas SET marcada").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.MarcarRespuesta(1, 20)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestForumRepo_MarcarRespuesta_SinResultado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	mock.ExpectExec("UPDATE Respuestas SET marcada").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.MarcarRespuesta(999, 20)
	if err != nil {
		t.Fatalf("esperaba exito (sin error en exec), obtuvo: %v", err)
	}
}

func TestForumRepo_ConsultarDudasClase_ConResultados(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	dudaRows := sqlmock.NewRows([]string{"id_dudas", "id_clase", "id_usuario", "duda", "segundo", "fecha_creacion"}).
		AddRow(1, 10, 20, "¿Qué es?", int32Ptr(30), "2025-01-15 10:00:00")
	mock.ExpectQuery("SELECT").WillReturnRows(dudaRows)

	respRows := sqlmock.NewRows([]string{"id_respuesta", "id_duda", "id_usuario", "respuesta", "marcada", "fecha_creacion"}).
		AddRow(1, 1, 30, "Es esto", false, "2025-01-15 11:00:00")
	mock.ExpectQuery("SELECT").WillReturnRows(respRows)

	dudas, totalPaginas, err := repo.ConsultarDudasClase(10, 1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if totalPaginas != 1 {
		t.Fatalf("esperaba 1 pagina, obtuvo %d", totalPaginas)
	}
	if len(dudas) != 1 {
		t.Fatalf("esperaba 1 duda, obtuvo %d", len(dudas))
	}
	if len(dudas[0].Respuestas) != 1 {
		t.Fatalf("esperaba 1 respuesta, obtuvo %d", len(dudas[0].Respuestas))
	}
}

func TestForumRepo_ConsultarDudasClase_SinResultados(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	dudaRows := sqlmock.NewRows([]string{"id_dudas", "id_clase", "id_usuario", "duda", "segundo", "fecha_creacion"})
	mock.ExpectQuery("SELECT").WillReturnRows(dudaRows)

	dudas, totalPaginas, err := repo.ConsultarDudasClase(10, 1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if totalPaginas != 0 {
		t.Fatalf("esperaba 0 paginas, obtuvo %d", totalPaginas)
	}
	if len(dudas) != 0 {
		t.Fatalf("esperaba 0 dudas, obtuvo %d", len(dudas))
	}
}

func TestForumRepo_ConsultarDudasClase_ErrorCount(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	mock.ExpectQuery("SELECT CEIL").WillReturnError(sql.ErrConnDone)
	_, _, err := repo.ConsultarDudasClase(10, 1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestForumRepo_ConsultarDudasClase_ErrorQuery(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresForumRepository(db)
	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, _, err := repo.ConsultarDudasClase(10, 1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func int32Ptr(v int32) *int32 {
	return &v
}
