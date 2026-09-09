package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-historial/types"
)

func TestNewPostgresLogRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestLogRepo_Consultar_ConRegistros(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	// 1) SELECT de registros (viene primero)
	auditRows := sqlmock.NewRows([]string{
		"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada",
		"fecha_evento", "estado_anterior", "estado_nuevo",
	}).AddRow(1, 1, "INSERT", "usuarios", "2025-01-15 10:00:00", nil, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(auditRows)

	// 2) SELECT CEIL (viene después)
	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(result.Registros))
	}
}

func TestLogRepo_Consultar_ConFiltros(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	auditRows := sqlmock.NewRows([]string{
		"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada",
		"fecha_evento", "estado_anterior", "estado_nuevo",
	}).AddRow(1, 1, "INSERT", "usuarios", "2025-01-15 10:00:00", nil, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(auditRows)

	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: 1, TablaFiltro: "usuarios"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(result.Registros))
	}
}

func TestLogRepo_Consultar_Vacio(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	auditRows := sqlmock.NewRows([]string{
		"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada",
		"fecha_evento", "estado_anterior", "estado_nuevo",
	})
	mock.ExpectQuery("SELECT").WillReturnRows(auditRows)

	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 0 {
		t.Fatalf("esperaba 0 registros, obtuvo %d", len(result.Registros))
	}
}

func TestLogRepo_Consultar_ErrorQuery(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogRepo_Consultar_ErrorCEIL(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	auditRows := sqlmock.NewRows([]string{
		"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada",
		"fecha_evento", "estado_anterior", "estado_nuevo",
	}).AddRow(1, 1, "INSERT", "usuarios", "2025-01-15 10:00:00", nil, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(auditRows)

	mock.ExpectQuery("SELECT CEIL").WillReturnError(sql.ErrConnDone)

	_, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogRepo_Consultar_ErrorScan(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	badRows := sqlmock.NewRows([]string{"id_auditoria"}).AddRow(1)
	mock.ExpectQuery("SELECT").WillReturnRows(badRows)

	_, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error de scan")
	}
}

func TestLogRepo_Consultar_ErrorRowsIteracion(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresLogRepository(db)

	auditRows := sqlmock.NewRows([]string{
		"id_auditoria", "usuario_responsable", "operacion", "tabla_afectada",
		"fecha_evento", "estado_anterior", "estado_nuevo",
	}).AddRow(1, 1, "INSERT", "usuarios", "2025-01-15 10:00:00", nil, nil)
	mock.ExpectQuery("SELECT").WillReturnRows(auditRows)

	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalPaginas != 0 {
		t.Fatalf("esperaba 0, obtuvo %d", result.TotalPaginas)
	}
}
