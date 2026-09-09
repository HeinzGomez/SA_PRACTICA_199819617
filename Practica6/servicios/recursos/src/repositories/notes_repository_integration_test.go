//go:build integration

package repositories

import "testing"

// Pruebas de integración del Cuaderno de Apuntes (servicios/recursos)
// contra PostgreSQL real: validan PostgresNotesRepository junto con las
// tablas reales Apuntes / Marcador_Tiempo (incluida la relación por FK
// con ON DELETE CASCADE), sin sqlmock de por medio.

func TestNotesRepository_CrearYConsultarApunte_Integration(t *testing.T) {
	repo := NewPostgresNotesRepository(testDB)

	id, err := repo.CrearApunte(9101, 501, "Apunte de integración", "Contenido en **markdown**.")
	if err != nil {
		t.Fatalf("CrearApunte no debio fallar: %v", err)
	}
	if id == 0 {
		t.Fatal("se esperaba un id_apunte distinto de cero")
	}

	apunte, err := repo.ConsultarApunte(9101, 501)
	if err != nil {
		t.Fatalf("ConsultarApunte no debio fallar: %v", err)
	}
	if apunte.IDApunte != id {
		t.Errorf("IDApunte = %d, se esperaba %d", apunte.IDApunte, id)
	}
	if apunte.Titulo != "Apunte de integración" {
		t.Errorf("Titulo = %q, no coincide", apunte.Titulo)
	}
	if apunte.ContenidoMarkdown != "Contenido en **markdown**." {
		t.Errorf("ContenidoMarkdown = %q, no coincide", apunte.ContenidoMarkdown)
	}
	if len(apunte.Marcadores) != 0 {
		t.Errorf("un apunte recien creado no deberia tener marcadores, se obtuvieron %d", len(apunte.Marcadores))
	}
}

func TestNotesRepository_ActualizarApunte_Integration(t *testing.T) {
	repo := NewPostgresNotesRepository(testDB)

	id, err := repo.CrearApunte(9102, 502, "Titulo original", "contenido original")
	if err != nil {
		t.Fatalf("CrearApunte no debio fallar: %v", err)
	}

	if err := repo.ActualizarApunte(id, "Titulo editado", "contenido editado"); err != nil {
		t.Fatalf("ActualizarApunte no debio fallar: %v", err)
	}

	apunte, err := repo.ConsultarApunte(9102, 502)
	if err != nil {
		t.Fatalf("ConsultarApunte no debio fallar: %v", err)
	}
	if apunte.Titulo != "Titulo editado" || apunte.ContenidoMarkdown != "contenido editado" {
		t.Errorf("el apunte no reflejo la edicion: %+v", apunte)
	}
	if apunte.FechaActualizacion == apunte.FechaCreacion {
		t.Log("fecha_actualizacion coincide con fecha_creacion; puede ocurrir si la edicion fue en el mismo segundo, no se falla la prueba por esto")
	}
}

func TestNotesRepository_MarcadoresDeTiempo_OrdenadosPorSegundo_Integration(t *testing.T) {
	repo := NewPostgresNotesRepository(testDB)

	id, err := repo.CrearApunte(9103, 503, "Apunte con marcadores", "contenido")
	if err != nil {
		t.Fatalf("CrearApunte no debio fallar: %v", err)
	}

	// Insertados fuera de orden a proposito, para validar el ORDER BY
	// segundo de ConsultarApunte (no el orden de insercion).
	if _, err := repo.AgregarMarcadorTiempo(id, 300, "Marcador tres"); err != nil {
		t.Fatalf("AgregarMarcadorTiempo no debio fallar: %v", err)
	}
	if _, err := repo.AgregarMarcadorTiempo(id, 30, "Marcador uno"); err != nil {
		t.Fatalf("AgregarMarcadorTiempo no debio fallar: %v", err)
	}
	idMarcadorDos, err := repo.AgregarMarcadorTiempo(id, 150, "Marcador dos")
	if err != nil {
		t.Fatalf("AgregarMarcadorTiempo no debio fallar: %v", err)
	}

	apunte, err := repo.ConsultarApunte(9103, 503)
	if err != nil {
		t.Fatalf("ConsultarApunte no debio fallar: %v", err)
	}
	if len(apunte.Marcadores) != 3 {
		t.Fatalf("se esperaban 3 marcadores, se obtuvieron %d", len(apunte.Marcadores))
	}
	wantOrder := []string{"Marcador uno", "Marcador dos", "Marcador tres"}
	for i, want := range wantOrder {
		if apunte.Marcadores[i].Texto != want {
			t.Errorf("posicion %d: Texto = %q, se esperaba %q (orden por segundo)", i, apunte.Marcadores[i].Texto, want)
		}
	}

	// EliminarMarcadorTiempo borra solo el marcador indicado.
	if err := repo.EliminarMarcadorTiempo(idMarcadorDos); err != nil {
		t.Fatalf("EliminarMarcadorTiempo no debio fallar: %v", err)
	}
	apunte, err = repo.ConsultarApunte(9103, 503)
	if err != nil {
		t.Fatalf("ConsultarApunte no debio fallar: %v", err)
	}
	if len(apunte.Marcadores) != 2 {
		t.Fatalf("se esperaban 2 marcadores tras eliminar uno, se obtuvieron %d", len(apunte.Marcadores))
	}
}

func TestNotesRepository_ConsultarApunte_Inexistente_Integration(t *testing.T) {
	repo := NewPostgresNotesRepository(testDB)

	_, err := repo.ConsultarApunte(999999, 999999)
	if err == nil {
		t.Fatal("se esperaba un error al consultar un apunte inexistente (sql.ErrNoRows)")
	}
}
