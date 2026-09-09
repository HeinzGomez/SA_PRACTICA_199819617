//go:build integration

package repositories

import (
	"testing"

	"servicio_recursos/types"
)

// Pruebas de integración del repositorio de Capítulos/Materiales
// (servicios/recursos) contra PostgreSQL real: validan que
// PostgresRepoRepository, los procedimientos almacenados
// (sp_agregar_archivo, sp_actualizar_version_archivo,
// sp_eliminar_archivo) y la vista vw_archivos_por_repositorio funcionen
// juntos tal como en producción. Los datos semilla de init.sql usan IDs
// fijos 1-3 / 1-6 / 1-12, así que cada prueba crea su propio repositorio
// nuevo (IDs autogenerados por SERIAL) para no interferir con ellos.

func TestRepoRepository_CrearRepositorio_Integration(t *testing.T) {
	repo := NewPostgresRepoRepository(testDB)

	id, err := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 9001, Nombre: "Repositorio de prueba"})
	if err != nil {
		t.Fatalf("CrearRepositorio no debio fallar: %v", err)
	}
	if id == 0 {
		t.Fatal("se esperaba un id_repositorio distinto de cero")
	}
}

// TestRepoRepository_ConsultarRepositorio_SinArchivos_Integration documenta
// (contra la base real, no un mock) el comportamiento actual de
// ConsultarRepositorio para un repositorio que aun no tiene archivos: su
// consulta hace "WHERE id_archivo IS NOT NULL" sobre la vista
// vw_archivos_por_repositorio, por lo que un repositorio sin archivos no
// produce NINGUNA fila y el resultado vuelve completamente vacio (no solo
// Archivos=[], sino tambien IDRepositorio/Nombre en su valor cero). Esta
// prueba de integracion es justamente el tipo de caso que un mock no
// detecta por si solo, porque depende del JOIN + filtro reales.
func TestRepoRepository_ConsultarRepositorio_SinArchivos_Integration(t *testing.T) {
	repo := NewPostgresRepoRepository(testDB)

	if _, err := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 9005, Nombre: "Repositorio vacio"}); err != nil {
		t.Fatalf("CrearRepositorio no debio fallar: %v", err)
	}

	info, err := repo.ConsultarRepositorio(9005)
	if err != nil {
		t.Fatalf("ConsultarRepositorio no debio fallar: %v", err)
	}
	if info.IDRepositorio != 0 || info.Nombre != "" {
		t.Errorf("comportamiento actual esperado: info vacio cuando no hay archivos, se obtuvo %+v", info)
	}
}

func TestRepoRepository_AgregarArchivoYVersion_Integration(t *testing.T) {
	repo := NewPostgresRepoRepository(testDB)

	idRepo, err := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 9002, Nombre: "Repositorio con archivos"})
	if err != nil {
		t.Fatalf("CrearRepositorio no debio fallar: %v", err)
	}

	idArchivo, err := repo.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: idRepo,
		Nombre:        "Guia de laboratorio.pdf",
		Link:          "https://ejemplo.com/guia-v1.pdf",
		Tag:           "v1",
		Hash:          "hash-v1",
	})
	if err != nil {
		t.Fatalf("AgregarArchivo no debio fallar: %v", err)
	}
	if idArchivo == 0 {
		t.Fatal("se esperaba un id_archivo distinto de cero")
	}

	// sp_agregar_archivo inserta tambien la primera version marcada como
	// "latest". Se valida a traves de la vista vw_archivos_por_repositorio,
	// que es exactamente lo que consume ConsultarRepositorio.
	info, err := repo.ConsultarRepositorio(9002)
	if err != nil {
		t.Fatalf("ConsultarRepositorio no debio fallar: %v", err)
	}
	if len(info.Archivos) != 1 || info.Archivos[0].IDArchivo != idArchivo {
		t.Fatalf("se esperaba 1 archivo con id %d, se obtuvo %+v", idArchivo, info.Archivos)
	}

	versiones, err := repo.ConsultarVersionesArchivo(idArchivo)
	if err != nil {
		t.Fatalf("ConsultarVersionesArchivo no debio fallar: %v", err)
	}
	if len(versiones) != 1 || !versiones[0].EsLatest {
		t.Fatalf("se esperaba exactamente 1 version marcada como latest, se obtuvo %+v", versiones)
	}

	// sp_actualizar_version_archivo debe: (a) desmarcar la version previa
	// como latest, y (b) insertar una nueva version SI marcada como latest.
	if err := repo.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{
		IDArchivo: idArchivo, Link: "https://ejemplo.com/guia-v2.pdf", Tag: "v2", Hash: "hash-v2",
	}); err != nil {
		t.Fatalf("ActualizarVersionArchivo no debio fallar: %v", err)
	}

	versiones, err = repo.ConsultarVersionesArchivo(idArchivo)
	if err != nil {
		t.Fatalf("ConsultarVersionesArchivo no debio fallar: %v", err)
	}
	if len(versiones) != 2 {
		t.Fatalf("se esperaban 2 versiones tras la actualizacion, se obtuvieron %d", len(versiones))
	}
	latestCount := 0
	for _, v := range versiones {
		if v.EsLatest {
			latestCount++
			if v.Tag != "v2" {
				t.Errorf("la version latest deberia ser la v2, se obtuvo tag=%q", v.Tag)
			}
		}
	}
	if latestCount != 1 {
		t.Errorf("se esperaba exactamente 1 version marcada como latest, se obtuvieron %d", latestCount)
	}
}

func TestRepoRepository_ActualizarTag_Integration(t *testing.T) {
	repo := NewPostgresRepoRepository(testDB)

	idRepo, _ := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 9003, Nombre: "Repositorio tag"})
	idArchivo, err := repo.AgregarArchivo(types.AgregarArchivoParams{IDRepositorio: idRepo, Nombre: "Archivo.pdf", Link: "https://ejemplo.com/a.pdf"})
	if err != nil {
		t.Fatalf("AgregarArchivo no debio fallar: %v", err)
	}
	versiones, err := repo.ConsultarVersionesArchivo(idArchivo)
	if err != nil || len(versiones) != 1 {
		t.Fatalf("no se pudo obtener la version base: err=%v versiones=%v", err, versiones)
	}

	if err := repo.ActualizarTag(versiones[0].IDVersion, "release-final"); err != nil {
		t.Fatalf("ActualizarTag no debio fallar: %v", err)
	}

	v, err := repo.ConsultarVersionArchivo(idArchivo, versiones[0].IDVersion)
	if err != nil {
		t.Fatalf("ConsultarVersionArchivo no debio fallar: %v", err)
	}
	if v.Tag != "release-final" {
		t.Errorf("Tag = %q, se esperaba %q", v.Tag, "release-final")
	}
}

func TestRepoRepository_EliminarArchivo_CascadeIntegration(t *testing.T) {
	repo := NewPostgresRepoRepository(testDB)

	idRepo, _ := repo.CrearRepositorio(types.CrearRepositorioParams{IDClase: 9004, Nombre: "Repositorio a limpiar"})
	idArchivo, err := repo.AgregarArchivo(types.AgregarArchivoParams{IDRepositorio: idRepo, Nombre: "Borrame.pdf", Link: "https://ejemplo.com/b.pdf"})
	if err != nil {
		t.Fatalf("AgregarArchivo no debio fallar: %v", err)
	}

	if err := repo.EliminarArchivo(idArchivo); err != nil {
		t.Fatalf("EliminarArchivo no debio fallar: %v", err)
	}

	// La FK "fk_version_archivo ... ON DELETE CASCADE" debe haber borrado
	// tambien sus versiones: ConsultarVersionesArchivo debe devolver una
	// lista vacia, no un error.
	versiones, err := repo.ConsultarVersionesArchivo(idArchivo)
	if err != nil {
		t.Fatalf("ConsultarVersionesArchivo no debio fallar tras el cascade: %v", err)
	}
	if len(versiones) != 0 {
		t.Errorf("se esperaban 0 versiones tras borrar el archivo (cascade), se obtuvieron %d", len(versiones))
	}

	info, err := repo.ConsultarRepositorio(9004)
	if err != nil {
		t.Fatalf("ConsultarRepositorio no debio fallar: %v", err)
	}
	if len(info.Archivos) != 0 {
		t.Errorf("el repositorio no deberia listar el archivo eliminado, se obtuvo %+v", info.Archivos)
	}
}
