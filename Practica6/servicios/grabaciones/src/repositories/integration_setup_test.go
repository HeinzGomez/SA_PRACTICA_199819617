//go:build integration

// HeinzGomez - Setup de pruebas de integración de capítulos (servicios/grabaciones)
// contra un PostgreSQL real. A diferencia de las pruebas con mocks del
// servicio, aquí se aplica el esquema real de
// servicios/grabaciones/database/init.sql (tablas, SP sp_registrar_capitulo
// y trigger de auditoría) y se validan el repositorio y la base de datos
// funcionando juntos, como en producción.
package repositories

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	_ "github.com/lib/pq"
)

// testDB es compartido por todas las pruebas de integración del paquete.
// El esquema (init.sql) se aplica UNA sola vez por corrida del binario de
// pruebas: no usa CREATE TABLE IF NOT EXISTS, así que aplicarlo dos veces
// contra la misma base fallaría.
var testDB *sql.DB

func getEnvOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func TestMain(m *testing.M) {
	host := getEnvOr("TEST_DB_HOST", "localhost")
	port := getEnvOr("TEST_DB_PORT", "5433")
	name := getEnvOr("TEST_DB_NAME", "grabdb_test")
	user := getEnvOr("TEST_DB_USER", "grabdb")
	pass := getEnvOr("TEST_DB_PASS", "secret")

	dsn := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable", host, port, name, user, pass)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[integration] no se pudo abrir la conexion de pruebas: %v\n", err)
		os.Exit(1)
	}
	if err := db.Ping(); err != nil {
		fmt.Fprintf(os.Stderr, "[integration] no se pudo conectar a %s:%s/%s: %v — "+
			"verifica que el servicio postgres de integracion este arriba\n", host, port, name, err)
		os.Exit(1)
	}

	if err := applySchema(db); err != nil {
		fmt.Fprintf(os.Stderr, "[integration] no se pudo aplicar servicios/grabaciones/database/init.sql: %v\n", err)
		os.Exit(1)
	}

	testDB = db
	code := m.Run()
	db.Close()
	os.Exit(code)
}

// applySchema ejecuta el MISMO init.sql que usa Docker en
// docker-entrypoint-initdb.d, para validar el esquema real (tablas, SPs y
// triggers de auditoría) y no una copia mantenida aparte.
func applySchema(db *sql.DB) error {
	sqlPath := getEnvOr("TEST_DB_INIT_SQL", locateInitSQL())
	content, err := os.ReadFile(sqlPath)
	if err != nil {
		return fmt.Errorf("no se pudo leer el esquema en %s: %w", sqlPath, err)
	}
	_, err = db.Exec(string(content))
	return err
}

// locateInitSQL resuelve database/init.sql relativo a este archivo fuente
// (servicios/grabaciones/src/repositories/ -> servicios/grabaciones/database/).
func locateInitSQL() string {
	_, thisFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "database", "init.sql")
}

// insertarClaseDePrueba inserta una clase_grabada nueva (id SERIAL) y
// devuelve su id, para que cada prueba use su propia clase y no colisione
// con la restriccion UNIQUE(id_clase, tiempo_inicio) ni con el seed.
func insertarClaseDePrueba(t *testing.T, duracioMin int32) int32 {
	t.Helper()
	var idClase int32
	err := testDB.QueryRow(
		`INSERT INTO clase_grabada
			(id_curso, id_periodo, id_area, titulo, fecha_impartida, duracio_min, descripcion, url_video, anio, num_semestre)
		 VALUES (1, 1, 1, 'Clase de integracion', '2026-01-01 09:00:00', $1, 'desc', 'https://example.com/v', 2026, 1)
		 RETURNING id_clase`,
		duracioMin,
	).Scan(&idClase)
	if err != nil {
		t.Fatalf("no se pudo insertar la clase de prueba: %v", err)
	}
	return idClase
}
