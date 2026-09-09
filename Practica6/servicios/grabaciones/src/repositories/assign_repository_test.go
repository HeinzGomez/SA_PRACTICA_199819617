package repositories

import (
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresAssignRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

func TestAssignRepo_AsignarDocente(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("CALL sp_asignar_docente").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.AsignarDocente(types.AsignarDocenteParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_AsignarAuxiliar(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("CALL sp_asignar_auxiliar").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.AsignarAuxiliar(types.AsignarAuxiliarParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_AsignarTemaClaseGrabada(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("CALL sp_asignar_tema_clase").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.AsignarTemaClaseGrabada(types.AsignarTemaClaseParams{IDClase: 1, IDTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_ConsultarParticipantesClase(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	rows := sqlmock.NewRows([]string{"id_clase", "id_usuario", "tipo_participante"}).
		AddRow(1, 1, "DOCENTE").AddRow(1, 2, "AUXILIAR")
	mock.ExpectQuery("SELECT").WillReturnRows(rows)
	result, err := repo.ConsultarParticipantesClase(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("esperaba 2, obtuvo %d", len(result))
	}
}

func TestAssignRepo_DesasignarDocente_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_docente").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.DesasignarDocente(types.DesasignarDocenteParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_DesasignarDocente_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_docente").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.DesasignarDocente(types.DesasignarDocenteParams{IDClase: 1, IDUsuario: 99})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAssignRepo_DesasignarAuxiliar_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_auxiliar").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.DesasignarAuxiliar(types.DesasignarAuxiliarParams{IDClase: 1, IDUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_DesasignarAuxiliar_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_auxiliar").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.DesasignarAuxiliar(types.DesasignarAuxiliarParams{IDClase: 1, IDUsuario: 99})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAssignRepo_DesasignarMaterialApoyo_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM material_apoyo").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.DesasignarMaterialApoyo(types.DesasignarMaterialApoyoParams{IDMaterial: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_DesasignarMaterialApoyo_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM material_apoyo").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.DesasignarMaterialApoyo(types.DesasignarMaterialApoyoParams{IDMaterial: 99})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAssignRepo_DesasignarTemaClase_Exitoso(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_tema").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.DesasignarTemaClaseGrabada(types.DesasignarTemaClaseParams{IDClase: 1, IDTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestAssignRepo_DesasignarTemaClase_NoExiste(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectExec("DELETE FROM clase_tema").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.DesasignarTemaClaseGrabada(types.DesasignarTemaClaseParams{IDClase: 1, IDTema: 99})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAssignRepo_AsignarMaterialApoyo(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresAssignRepository(db)
	mock.ExpectBegin()
	mock.ExpectExec("CALL sp_agregar_material").WillReturnResult(sqlmock.NewResult(0, 0))
	rows := sqlmock.NewRows([]string{"id_material"}).AddRow(1)
	mock.ExpectQuery("SELECT id_material").WillReturnRows(rows)
	mock.ExpectCommit()
	materialRows := sqlmock.NewRows([]string{"id_material", "id_clase", "nombre", "tipo", "url"}).
		AddRow(1, 1, "Material1", "PDF", "https://x")
	mock.ExpectQuery("SELECT").WillReturnRows(materialRows)
	result, err := repo.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{
		IDClase: 1, Nombre: "Material1", Tipo: "PDF", URL: "https://x",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}
