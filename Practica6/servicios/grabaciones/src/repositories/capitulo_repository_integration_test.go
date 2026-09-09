//go:build integration

// HeinzGomez - Pruebas de integración del repositorio de capítulos contra
// PostgreSQL real: ejercitan CapituloRepository junto con el procedimiento
// almacenado sp_registrar_capitulo, la restricción UNIQUE(id_clase,
// tiempo_inicio), el CHECK(tiempo_inicio >= 0) y el trigger de auditoría.
package repositories

import (
	"database/sql"
	"errors"
	"testing"

	"servicio-grabaciones/types"
)

func TestCapituloRepository_CrearYConsultarOrdenado_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60) // 3600s

	// Insertados fuera de orden para validar el ORDER BY tiempo_inicio.
	for _, c := range []struct {
		titulo string
		t      int32
	}{{"Cierre", 750}, {"Introduccion", 0}, {"Desarrollo", 300}} {
		if _, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: c.titulo, TiempoInicio: c.t}); err != nil {
			t.Fatalf("CrearCapitulo(%q,%d) no debio fallar: %v", c.titulo, c.t, err)
		}
	}

	caps, err := repo.ConsultarCapitulosClase(idClase)
	if err != nil {
		t.Fatalf("ConsultarCapitulosClase no debio fallar: %v", err)
	}
	if len(caps) != 3 {
		t.Fatalf("se esperaban 3 capitulos, se obtuvieron %d", len(caps))
	}
	wantTitulos := []string{"Introduccion", "Desarrollo", "Cierre"}
	wantTiempos := []int32{0, 300, 750}
	for i := range caps {
		if caps[i].Titulo != wantTitulos[i] || caps[i].TiempoInicio != wantTiempos[i] {
			t.Errorf("posicion %d: (%q,%d), se esperaba (%q,%d)",
				i, caps[i].Titulo, caps[i].TiempoInicio, wantTitulos[i], wantTiempos[i])
		}
		if caps[i].IDClase != idClase {
			t.Errorf("IDClase = %d, se esperaba %d", caps[i].IDClase, idClase)
		}
	}
}

func TestCapituloRepository_ExisteTiempoEnClase_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60)

	cap, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Tema", TiempoInicio: 120})
	if err != nil {
		t.Fatalf("CrearCapitulo no debio fallar: %v", err)
	}

	existe, err := repo.ExisteTiempoEnClase(idClase, 120, 0)
	if err != nil || !existe {
		t.Fatalf("se esperaba que la marca 120 exista (existe=%v err=%v)", existe, err)
	}
	// Excluyendo el propio capitulo, ya no debe "existir" un duplicado.
	existe, err = repo.ExisteTiempoEnClase(idClase, 120, cap.ID)
	if err != nil || existe {
		t.Fatalf("excluyendo el propio id no deberia contar como duplicado (existe=%v err=%v)", existe, err)
	}
	existe, err = repo.ExisteTiempoEnClase(idClase, 999, 0)
	if err != nil || existe {
		t.Fatalf("no deberia existir un capitulo en la marca 999 (existe=%v err=%v)", existe, err)
	}
}

func TestCapituloRepository_Editar_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60)

	cap, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Original", TiempoInicio: 200})
	if err != nil {
		t.Fatalf("CrearCapitulo no debio fallar: %v", err)
	}

	if _, err := repo.EditarCapitulo(types.EditarCapituloParams{ID: cap.ID, Titulo: "Editado", TiempoInicio: 250}); err != nil {
		t.Fatalf("EditarCapitulo no debio fallar: %v", err)
	}

	actualizado, err := repo.BuscarCapituloPorId(cap.ID)
	if err != nil {
		t.Fatalf("BuscarCapituloPorId no debio fallar: %v", err)
	}
	if actualizado.Titulo != "Editado" || actualizado.TiempoInicio != 250 {
		t.Errorf("la edicion no se reflejo: %+v", actualizado)
	}
}

func TestCapituloRepository_Eliminar_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60)

	cap, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Temporal", TiempoInicio: 400})
	if err != nil {
		t.Fatalf("CrearCapitulo no debio fallar: %v", err)
	}
	if err := repo.EliminarCapitulo(cap.ID); err != nil {
		t.Fatalf("EliminarCapitulo no debio fallar: %v", err)
	}
	if _, err := repo.BuscarCapituloPorId(cap.ID); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("se esperaba sql.ErrNoRows tras eliminar, se obtuvo: %v", err)
	}
	// Eliminar un id inexistente debe reportar sql.ErrNoRows.
	if err := repo.EliminarCapitulo(cap.ID); !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("eliminar un capitulo inexistente deberia dar sql.ErrNoRows, se obtuvo: %v", err)
	}
}

func TestCapituloRepository_SP_MarcaDuplicada_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60)

	if _, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Uno", TiempoInicio: 500}); err != nil {
		t.Fatalf("primer CrearCapitulo no debio fallar: %v", err)
	}
	// El SP sp_registrar_capitulo debe rechazar la marca duplicada.
	if _, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Dos", TiempoInicio: 500}); err == nil {
		t.Fatal("se esperaba error del SP por marca de tiempo duplicada")
	}
}

func TestCapituloRepository_SP_ClaseInexistente_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	if _, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: 999999, Titulo: "X", TiempoInicio: 10}); err == nil {
		t.Fatal("se esperaba error del SP por clase inexistente")
	}
}

func TestCapituloRepository_TriggerAuditoria_Integration(t *testing.T) {
	repo := NewPostgresCapituloRepository(testDB)
	idClase := insertarClaseDePrueba(t, 60)

	if _, err := repo.CrearCapitulo(types.CrearCapituloParams{IDClase: idClase, Titulo: "Auditado", TiempoInicio: 600}); err != nil {
		t.Fatalf("CrearCapitulo no debio fallar: %v", err)
	}

	var total int
	err := testDB.QueryRow(
		"SELECT COUNT(*) FROM audit_logs WHERE tabla_afectada = 'capitulo' AND operacion = 'INSERT'",
	).Scan(&total)
	if err != nil {
		t.Fatalf("no se pudo consultar audit_logs: %v", err)
	}
	if total < 1 {
		t.Fatal("el trigger de auditoria debio registrar al menos un INSERT en capitulo")
	}
}
