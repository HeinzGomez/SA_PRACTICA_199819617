//go:build integration

// Pruebas de integración (build tag "integration") de servicios/recursos:
// a diferencia de los archivos *_test.go existentes en este paquete (que
// usan github.com/DATA-DOG/go-sqlmock, es decir, una base de datos
// simulada), estas pruebas se conectan a un PostgreSQL real — el mismo
// servicio "postgres" que levanta el job de CI, con el esquema real de
// servicios/recursos/database/init.sql (tablas, vistas, procedimientos
// almacenados y triggers de auditoría) — y validan que el repositorio y
// la base de datos funcionen juntos tal como en producción.
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

// testDB es compartido por todas las pruebas de integración de este
// paquete: el esquema (init.sql) solo se aplica UNA vez por corrida del
// binario de pruebas, ya que no usa "CREATE TABLE IF NOT EXISTS" —
// aplicarlo dos veces contra la misma base fallaría.
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
	name := getEnvOr("TEST_DB_NAME", "resourcedb_test")
	user := getEnvOr("TEST_DB_USER", "resourcedb")
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
		fmt.Fprintf(os.Stderr, "[integration] no se pudo aplicar servicios/recursos/database/init.sql: %v\n", err)
		os.Exit(1)
	}

	testDB = db
	code := m.Run()
	db.Close()
	os.Exit(code)
}

// applySchema ejecuta el MISMO init.sql que usa Docker en
// docker-entrypoint-initdb.d, para que las pruebas de integracion
// validen el esquema real (tablas, vista, SPs, triggers de auditoria)
// y no una copia mantenida aparte. lib/pq ejecuta el script completo
// (multiples sentencias) via el protocolo simple de Postgres cuando el
// Exec no recibe parametros posicionales, que es el caso aqui.
func applySchema(db *sql.DB) error {
	sqlPath := getEnvOr("TEST_DB_INIT_SQL", locateInitSQL())
	content, err := os.ReadFile(sqlPath)
	if err != nil {
		return fmt.Errorf("no se pudo leer el esquema en %s: %w", sqlPath, err)
	}
	_, err = db.Exec(string(content))
	return err
}

// locateInitSQL resuelve database/init.sql relativo a este archivo
// fuente (servicios/recursos/src/repositories/ -> servicios/recursos/database/).
func locateInitSQL() string {
	_, thisFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "database", "init.sql")
}
