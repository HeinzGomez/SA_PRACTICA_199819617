package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio_recursos/types"
)

func TestNewPostgresRepoRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestRepoRepo_CrearRepositorio(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	rows := sqlmock.NewRows([]string{"id_repositorio"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO Repositorio").WillReturnRows(rows)
	id, err := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 1, Nombre: "Repo1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestRepoRepo_AgregarArchivo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	mock.ExpectExec("CALL sp_agregar_archivo").WillReturnResult(sqlmock.NewResult(0, 0))
	rows := sqlmock.NewRows([]string{"id_archivo"}).AddRow(1)
	mock.ExpectQuery("SELECT id_archivo").WillReturnRows(rows)
	id, err := repo.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: 1, Nombre: "file.go", Link: "https://x", Tag: "v1", Hash: "abc",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestRepoRepo_ActualizarVersionArchivo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	mock.ExpectExec("CALL sp_actualizar_version_archivo").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{
		IDArchivo: 1, Link: "https://x", Tag: "v2", Hash: "def",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestRepoRepo_ActualizarTag(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	mock.ExpectExec("UPDATE Version").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.ActualizarTag(1, "v3")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestRepoRepo_EliminarArchivo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	mock.ExpectExec("CALL sp_eliminar_archivo").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarArchivo(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestRepoRepo_ConsultarRepositorio(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	rows := sqlmock.NewRows([]string{"id_repositorio", "id_clase", "repositorio_nombre", "id_archivo", "archivo_nombre"}).
		AddRow(1, 10, "Repo1", 1, "file.go")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	info, err := repo.ConsultarRepositorio(10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if info.IDRepositorio != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", info.IDRepositorio)
	}
}

func TestRepoRepo_ConsultarRepositorio_Vacio(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	rows := sqlmock.NewRows([]string{"id_repositorio", "id_clase", "repositorio_nombre", "id_archivo", "archivo_nombre"})
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	info, err := repo.ConsultarRepositorio(10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if info.Archivos == nil {
		t.Fatal("esperaba slice vacío, obtuvo nil")
	}
}

func TestRepoRepo_ConsultarVersionesArchivo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	rows := sqlmock.NewRows([]string{"id_version", "id_archivo", "link", "tag", "fecha_creacion", "hash", "latest"}).
		AddRow(1, 1, "https://x", "v1", "2025-01-15 10:00:00", "abc", true)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	versiones, err := repo.ConsultarVersionesArchivo(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(versiones) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(versiones))
	}
}

func TestRepoRepo_ConsultarVersionArchivo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresRepoRepository(db)
	rows := sqlmock.NewRows([]string{"id_version", "id_archivo", "link", "tag", "fecha_creacion", "hash", "latest"}).
		AddRow(1, 1, "https://x", "v1", "2025-01-15 10:00:00", "abc", true)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	v, err := repo.ConsultarVersionArchivo(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if v.IDVersion != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", v.IDVersion)
	}
}
