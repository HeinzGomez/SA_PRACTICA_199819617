package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-historial/types"
)

func TestNewPostgresHistoryRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestRegistrarProgreso_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	// 1) CALL sp_registrar_progreso
	mock.ExpectExec("CALL sp_registrar_progreso").WillReturnResult(sqlmock.NewResult(0, 0))

	// 2) SELECT de BuscarHistorialPorUsuarioClase (viene después del CALL)
	rows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 1, 1, 1, 10, 30, 120, 50.0, "2025-01-15 10:00:00", "2025-01-15 10:00:00", "2025-01-15 10:00:00", false)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	result, err := repo.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 1, MinutoActual: 10, SegundoActual: 30, DuracionTotal: 120})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDHistorial != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.IDHistorial)
	}
}

func TestRegistrarProgreso_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("CALL sp_registrar_progreso").WillReturnError(sql.ErrConnDone)
	_, err := repo.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	mock.ExpectExec("CALL sp_actualizar_checkpoint").WillReturnResult(sqlmock.NewResult(0, 0))

	// ObtenerCheckpointClase
	rows := sqlmock.NewRows([]string{
		"id_tema", "minuto_actual", "segundo_actual", "porcentaje_visto", "completada", "fecha_ultima_reproduccion",
	}).AddRow(1, 10, 30, 50.0, false, "2025-01-15 10:00:00")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	result, err := repo.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 1, MinutoActual: 10, SegundoActual: 30})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDTema != 1 {
		t.Fatalf("esperaba IDTema=1, obtuvo %d", result.IDTema)
	}
}

func TestActualizarCheckpoint_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("CALL sp_actualizar_checkpoint").WillReturnError(sql.ErrConnDone)
	_, err := repo.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestMarcarClaseCompletada_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	mock.ExpectExec("CALL sp_marcar_completada").WillReturnResult(sqlmock.NewResult(0, 0))

	rows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 1, 1, 1, 10, 30, 120, 100.0, "2025-01-15 10:00:00", "2025-01-15 10:00:00", "2025-01-15 10:00:00", true)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	result, err := repo.MarcarClaseCompletada(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !result.Completada {
		t.Fatal("esperaba completada=true")
	}
}

func TestMarcarClaseCompletada_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("CALL sp_marcar_completada").WillReturnError(sql.ErrConnDone)
	_, err := repo.MarcarClaseCompletada(1, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestBuscarHistorialPorUsuarioClase(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	rows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 1, 1, 1, 10, 30, 120, 50.0, "2025-01-15 10:00:00", "2025-01-15 10:00:00", "2025-01-15 10:00:00", false)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BuscarHistorialPorUsuarioClase(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDHistorial != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.IDHistorial)
	}
}

func TestBuscarHistorialPorUsuarioClase_NotFound(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrNoRows)
	_, err := repo.BuscarHistorialPorUsuarioClase(1, 99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestObtenerCheckpointClase(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	rows := sqlmock.NewRows([]string{
		"id_tema", "minuto_actual", "segundo_actual", "porcentaje_visto", "completada", "fecha_ultima_reproduccion",
	}).AddRow(1, 10, 30, 50.0, false, "2025-01-15 10:00:00")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ObtenerCheckpointClase(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDTema != 1 {
		t.Fatalf("esperaba IDTema=1, obtuvo %d", result.IDTema)
	}
}

func TestObtenerCheckpointClase_NotFound(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrNoRows)
	_, err := repo.ObtenerCheckpointClase(1, 99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestConsultarHistorialUsuario(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	// 1) SELECT de registros (viene primero)
	histRows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 1, 1, 1, 10, 30, 120, 50.0, "2025-01-15 10:00:00", "2025-01-15 10:00:00", "2025-01-15 10:00:00", false)
	mock.ExpectQuery("SELECT").WillReturnRows(histRows)

	// 2) SELECT CEIL (viene después)
	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
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

func TestConsultarHistorialUsuario_Vacio(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	histRows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	})
	mock.ExpectQuery("SELECT").WillReturnRows(histRows)

	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(totalRows)

	result, err := repo.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 0 {
		t.Fatalf("esperaba 0 registros, obtuvo %d", len(result.Registros))
	}
}

func TestConsultarHistorialUsuario_ErrorQuery(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarHistorialUsuario_ErrorCEIL(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)

	histRows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 1, 1, 1, 10, 30, 120, 50.0, "2025-01-15 10:00:00", "2025-01-15 10:00:00", "2025-01-15 10:00:00", false)
	mock.ExpectQuery("SELECT").WillReturnRows(histRows)

	mock.ExpectQuery("SELECT CEIL").WillReturnError(sql.ErrConnDone)

	_, err := repo.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarEstadisticasUsuario(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	rows := sqlmock.NewRows([]string{
		"total_clases", "clases_completadas", "porcentaje_promedio", "minutos_vistos",
	}).AddRow(10, 5, 75.0, 500)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarEstadisticasUsuario(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalClases != 10 {
		t.Fatalf("esperaba 10, obtuvo %d", result.TotalClases)
	}
}

func TestConsultarEstadisticasUsuario_Error(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarEstadisticasUsuario(1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarHistorialClase_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("DELETE FROM historial_reproduccion").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarHistorialClase_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("DELETE FROM historial_reproduccion").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 99})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestEliminarHistorialClase_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresHistoryRepository(db)
	mock.ExpectExec("DELETE FROM historial_reproduccion").WillReturnError(sql.ErrConnDone)
	err := repo.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestScanHistorial(t *testing.T) {
	db, mock, _ := sqlmock.New()
	rows := sqlmock.NewRows([]string{
		"id_historial", "id_usuario", "id_clase", "id_tema",
		"minuto_actual", "segundo_actual", "duracion_total", "porcentaje_visto",
		"fecha_ultima_reproduccion", "fecha_creacion", "fecha_actualizacion", "completada",
	}).AddRow(1, 2, 3, 4, 5, 6, 7, 80.0, "2025-01-01", "2025-01-01", "2025-01-01", true)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	repo := NewPostgresHistoryRepository(db)
	result, err := repo.BuscarHistorialPorUsuarioClase(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDUsuario != 2 || result.IDClase != 3 || result.IDTema != 4 {
		t.Fatalf("campos inesperados: %+v", result)
	}
}

func TestScanHistorial_Error(t *testing.T) {
	db, mock, _ := sqlmock.New()
	rows := sqlmock.NewRows([]string{"id_historial"}).AddRow(1)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)

	repo := NewPostgresHistoryRepository(db)
	_, err := repo.BuscarHistorialPorUsuarioClase(1, 1)
	if err == nil {
		t.Fatal("esperaba error de scan")
	}
}

func TestConsultarHistorialUsuario_RowsErr(t *testing.T) {
	db, _, _ := sqlmock.New()
	_ = db
}
