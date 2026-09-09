package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresClassRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestClassRepo_EditarClaseGrabada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	rows := sqlmock.NewRows([]string{"id_clase", "id_curso", "id_periodo", "id_area", "titulo",
		"fecha_impartida", "duracio_min", "descripcion", "url_video", "anio", "num_semestre"}).
		AddRow(1, 1, 1, 1, "Editada", "2025-01-15 10:00:00", 60, nil, "https://x", 2025, 1)
	mock.ExpectQuery("UPDATE clase_grabada").WillReturnRows(rows)
	result, err := repo.EditarClaseGrabada(types.EditarClaseGrabadaParams{
		ID: 1, IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Editada",
		FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60, URLVideo: "https://x", Anio: 2025, NumSemestre: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestClassRepo_EditarClaseGrabada_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	mock.ExpectQuery("UPDATE clase_grabada").WillReturnError(sql.ErrNoRows)
	_, err := repo.EditarClaseGrabada(types.EditarClaseGrabadaParams{ID: 99})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestClassRepo_EliminarClaseGrabada_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	mock.ExpectExec("DELETE FROM clase_grabada").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarClaseGrabada(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestClassRepo_EliminarClaseGrabada_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	mock.ExpectExec("DELETE FROM clase_grabada").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarClaseGrabada(99)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestClassRepo_BuscarClaseGrabada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	rows := sqlmock.NewRows([]string{"id_clase", "id_curso", "id_periodo", "id_area", "titulo",
		"fecha_impartida", "duracio_min", "descripcion", "url_video", "anio", "num_semestre"}).
		AddRow(1, 1, 1, 1, "Clase 1", "2025-01-15 10:00:00", 60, nil, "https://x", 2025, 1)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BuscarClaseGrabada(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestClassRepo_ConsultarCatalogoClases(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(totalRows)
	rows := sqlmock.NewRows([]string{"id_clase", "titulo", "descripcion", "fecha_impartida",
		"duracio_min", "url_video", "anio", "num_semestre", "id_curso", "id_area", "id_periodo"}).
		AddRow(1, "Clase 1", nil, "2025-01-15 10:00:00", 60, "https://x", 2025, 1, 1, 1, 1)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarCatalogoClases(types.ConsultarCatalogoClasesParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(result.Registros))
	}
}

func TestClassRepo_BusquedaAvanzada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	totalRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT COUNT").WillReturnRows(totalRows)
	rows := sqlmock.NewRows([]string{"id_clase", "titulo", "descripcion", "fecha_impartida",
		"duracion", "url_video", "anio", "semestre", "id_curso", "id_area", "id_periodo"}).
		AddRow(1, "Clase 1", nil, "2025-01-15 10:00:00", 60, "https://x", 2025, 1, 1, 1, 1)
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.BusquedaAvanzada(types.BusquedaAvanzadaFiltros{Anio: 2025})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(result.Registros))
	}
}

func TestClassRepo_ConsultarFichaTecnica(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	rows := sqlmock.NewRows([]string{"id_clase", "titulo", "descripcion", "fecha_impartida",
		"duracio_min", "url_video", "id_unidad", "unidad", "id_tema", "tema",
		"id_material", "material", "tipo", "url"}).
		AddRow(1, "Clase 1", nil, "2025-01-15 10:00:00", 60, "https://x", 1, "U1", 1, "T1", 1, "Mat1", "PDF", "https://mat")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarFichaTecnica(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(result))
	}
}

func TestClassRepo_ObtenerEnlaceClaseGrabada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	rows := sqlmock.NewRows([]string{"url_video"}).AddRow("https://video.test")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ObtenerEnlaceClaseGrabada(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result != "https://video.test" {
		t.Fatalf("esperaba URL, obtuvo %s", result)
	}
}

func TestClassRepo_CargaMasivaClases(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	mock.ExpectExec("CALL sp_carga_masiva_clases").WillReturnResult(sqlmock.NewResult(0, 0))
	result, err := repo.CargaMasivaClases(`[{"titulo":"X"}]`)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result != "[]" {
		t.Fatalf("esperaba '[]', obtuvo %s", result)
	}
}

func TestClassRepo_CrearClaseGrabada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresClassRepository(db)
	mock.ExpectBegin()
	mock.ExpectExec("CALL sp_registrar_clase").WillReturnResult(sqlmock.NewResult(0, 0))
	rows := sqlmock.NewRows([]string{"currval"}).AddRow(1)
	mock.ExpectQuery("SELECT currval").WillReturnRows(rows)
	mock.ExpectCommit()
	claseRows := sqlmock.NewRows([]string{"id_clase", "id_curso", "id_periodo", "id_area", "titulo",
		"fecha_impartida", "duracio_min", "descripcion", "url_video", "anio", "num_semestre"}).
		AddRow(1, 1, 1, 1, "Clase 1", "2025-01-15 10:00:00", 60, nil, "https://x", 2025, 1)
	mock.ExpectQuery("SELECT").WillReturnRows(claseRows)
	result, err := repo.CrearClaseGrabada(types.CrearClaseGrabadaParams{
		IDCurso: 1, IDPeriodo: 1, IDArea: 1, Titulo: "Clase 1",
		FechaImpartida: "2025-01-15 10:00:00", DuracionMin: 60, URLVideo: "https://x",
		Anio: 2025, NumSemestre: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestNormalizarPagina_MenorA1(t *testing.T) {
	pagina, limite := normalizarPagina(0, 10)
	if pagina != 1 {
		t.Fatalf("esperaba pagina=1, obtuvo %d", pagina)
	}
	if limite != 10 {
		t.Fatalf("esperaba limite=10, obtuvo %d", limite)
	}
}

func TestNormalizarPagina_ValorValido(t *testing.T) {
	pagina, _ := normalizarPagina(3, 10)
	if pagina != 3 {
		t.Fatalf("esperaba pagina=3, obtuvo %d", pagina)
	}
}

func TestTotalPaginas_Cero(t *testing.T) {
	result := totalPaginas(0, 10)
	if result != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", result)
	}
}

func TestTotalPaginas_ConRegistros(t *testing.T) {
	result := totalPaginas(25, 10)
	if result != 3 {
		t.Fatalf("esperaba 3, obtuvo %d", result)
	}
}

func TestNullableInt_Cero(t *testing.T) {
	result := nullableInt(0)
	if result != nil {
		t.Fatalf("esperaba nil, obtuvo %v", result)
	}
}

func TestNullableInt_ConValor(t *testing.T) {
	result := nullableInt(5)
	if result != int32(5) {
		t.Fatalf("esperaba 5, obtuvo %v", result)
	}
}
