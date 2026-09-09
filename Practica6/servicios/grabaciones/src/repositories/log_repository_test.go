package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresLogRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestLogRepo_Consultar_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	logRows := sqlmock.NewRows([]string{"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada", "fecha_evento", "estado_anterior", "estado_nuevo"}).
		AddRow(1, 1, "INSERT", "curso", "2025-01-15 10:00:00", nil, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(logRows)

	totalRows := sqlmock.NewRows([]string{"total"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: 0, TablaFiltro: ""})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(result.Registros))
	}
	if result.TotalPaginas != 1 {
		t.Fatalf("esperaba 1 pagina, obtuvo %d", result.TotalPaginas)
	}
}

func TestLogRepo_Consultar_SinRegistros(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	logRows := sqlmock.NewRows([]string{"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada", "fecha_evento", "estado_anterior", "estado_nuevo"})
	mock.ExpectQuery("SELECT").WillReturnRows(logRows)

	totalRows := sqlmock.NewRows([]string{"total"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: 1, TablaFiltro: "curso"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 0 {
		t.Fatalf("esperaba 0 registros, obtuvo %d", len(result.Registros))
	}
}
