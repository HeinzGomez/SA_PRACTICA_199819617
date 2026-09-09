package config

import (
	"os"
	"testing"
)

func TestDSN(t *testing.T) {
	cfg := DatabaseConfig{Host: "localhost", Port: 5432, Name: "testdb", User: "testuser", Pass: "testpass"}
	dsn := cfg.DSN()
	if dsn == "" {
		t.Fatal("esperaba DSN no vacio")
	}
}

func TestDSN_Campos(t *testing.T) {
	cfg := DatabaseConfig{Host: "myhost", Port: 3306, Name: "mydb", User: "myuser", Pass: "mypass"}
	dsn := cfg.DSN()
	if dsn == "" {
		t.Fatal("esperaba DSN no vacio")
	}
}

func TestRequired_ConValor(t *testing.T) {
	os.Setenv("TEST_REQUIRED_KEY", "testvalue")
	defer os.Unsetenv("TEST_REQUIRED_KEY")
	value, err := required("TEST_REQUIRED_KEY")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if value != "testvalue" {
		t.Fatalf("esperaba 'testvalue', obtuvo '%s'", value)
	}
}

func TestRequired_SinValor(t *testing.T) {
	os.Unsetenv("TEST_REQUIRED_KEY")
	_, err := required("TEST_REQUIRED_KEY")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRequiredInt_ConValor(t *testing.T) {
	os.Setenv("TEST_REQUIRED_INT_KEY", "8080")
	defer os.Unsetenv("TEST_REQUIRED_INT_KEY")
	value, err := requiredInt("TEST_REQUIRED_INT_KEY")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if value != 8080 {
		t.Fatalf("esperaba 8080, obtuvo %d", value)
	}
}

func TestRequiredInt_NoNumerico(t *testing.T) {
	os.Setenv("TEST_REQUIRED_INT_KEY", "abc")
	defer os.Unsetenv("TEST_REQUIRED_INT_KEY")
	_, err := requiredInt("TEST_REQUIRED_INT_KEY")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRequiredInt_SinValor(t *testing.T) {
	os.Unsetenv("TEST_REQUIRED_INT_KEY")
	_, err := requiredInt("TEST_REQUIRED_INT_KEY")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLoad_TodoConfigurado(t *testing.T) {
	envVars := map[string]string{
		"HISTORY_DB_HOST":     "dbhost",
		"HISTORY_DB_NAME":     "dbname",
		"HISTORY_DB_USER":     "dbuser",
		"HISTORY_DB_PASS":     "dbpass",
		"HISTORY_DB_PORT":     "5432",
		"HISTORY_GRPC_PORT":   "50055",
		"HISTORY_HTTP_PORT":   "3005",
	}
	for k, v := range envVars {
		os.Setenv(k, v)
	}
	defer func() {
		for k := range envVars {
			os.Unsetenv(k)
		}
	}()

	cfg, err := load()
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if cfg.DB.Host != "dbhost" {
		t.Fatalf("esperaba dbhost, obtuvo %s", cfg.DB.Host)
	}
	if cfg.DB.Port != 5432 {
		t.Fatalf("esperaba 5432, obtuvo %d", cfg.DB.Port)
	}
	if cfg.Server.GRPCPort != 50055 {
		t.Fatalf("esperaba 50055, obtuvo %d", cfg.Server.GRPCPort)
	}
	if cfg.Server.HTTPPort != 3005 {
		t.Fatalf("esperaba 3005, obtuvo %d", cfg.Server.HTTPPort)
	}
}

func TestLoad_FaltaHost(t *testing.T) {
	os.Setenv("HISTORY_DB_NAME", "db")
	os.Setenv("HISTORY_DB_USER", "user")
	os.Setenv("HISTORY_DB_PASS", "pass")
	os.Setenv("HISTORY_DB_PORT", "5432")
	os.Setenv("HISTORY_GRPC_PORT", "50055")
	os.Setenv("HISTORY_HTTP_PORT", "3005")
	defer func() {
		os.Unsetenv("HISTORY_DB_HOST")
		os.Unsetenv("HISTORY_DB_NAME")
		os.Unsetenv("HISTORY_DB_USER")
		os.Unsetenv("HISTORY_DB_PASS")
		os.Unsetenv("HISTORY_DB_PORT")
		os.Unsetenv("HISTORY_GRPC_PORT")
		os.Unsetenv("HISTORY_HTTP_PORT")
	}()
	os.Unsetenv("HISTORY_DB_HOST")

	_, err := load()
	if err == nil {
		t.Fatal("esperaba error por HOST faltante")
	}
}

func TestLoad_FaltaDBPort(t *testing.T) {
	os.Setenv("HISTORY_DB_HOST", "host")
	os.Setenv("HISTORY_DB_NAME", "db")
	os.Setenv("HISTORY_DB_USER", "user")
	os.Setenv("HISTORY_DB_PASS", "pass")
	os.Setenv("HISTORY_GRPC_PORT", "50055")
	os.Setenv("HISTORY_HTTP_PORT", "3005")
	defer func() {
		os.Unsetenv("HISTORY_DB_HOST")
		os.Unsetenv("HISTORY_DB_NAME")
		os.Unsetenv("HISTORY_DB_USER")
		os.Unsetenv("HISTORY_DB_PASS")
		os.Unsetenv("HISTORY_DB_PORT")
		os.Unsetenv("HISTORY_GRPC_PORT")
		os.Unsetenv("HISTORY_HTTP_PORT")
	}()
	os.Unsetenv("HISTORY_DB_PORT")

	_, err := load()
	if err == nil {
		t.Fatal("esperaba error por DB_PORT faltante")
	}
}

func TestLoad_DBPortNoNumerico(t *testing.T) {
	os.Setenv("HISTORY_DB_HOST", "host")
	os.Setenv("HISTORY_DB_NAME", "db")
	os.Setenv("HISTORY_DB_USER", "user")
	os.Setenv("HISTORY_DB_PASS", "pass")
	os.Setenv("HISTORY_DB_PORT", "abc")
	os.Setenv("HISTORY_GRPC_PORT", "50055")
	os.Setenv("HISTORY_HTTP_PORT", "3005")
	defer func() {
		os.Unsetenv("HISTORY_DB_HOST")
		os.Unsetenv("HISTORY_DB_NAME")
		os.Unsetenv("HISTORY_DB_USER")
		os.Unsetenv("HISTORY_DB_PASS")
		os.Unsetenv("HISTORY_DB_PORT")
		os.Unsetenv("HISTORY_GRPC_PORT")
		os.Unsetenv("HISTORY_HTTP_PORT")
	}()

	_, err := load()
	if err == nil {
		t.Fatal("esperaba error por DB_PORT no numerico")
	}
}

func TestLoad_FaltaGRPCPort(t *testing.T) {
	os.Setenv("HISTORY_DB_HOST", "host")
	os.Setenv("HISTORY_DB_NAME", "db")
	os.Setenv("HISTORY_DB_USER", "user")
	os.Setenv("HISTORY_DB_PASS", "pass")
	os.Setenv("HISTORY_DB_PORT", "5432")
	os.Setenv("HISTORY_HTTP_PORT", "3005")
	defer func() {
		os.Unsetenv("HISTORY_DB_HOST")
		os.Unsetenv("HISTORY_DB_NAME")
		os.Unsetenv("HISTORY_DB_USER")
		os.Unsetenv("HISTORY_DB_PASS")
		os.Unsetenv("HISTORY_DB_PORT")
		os.Unsetenv("HISTORY_GRPC_PORT")
		os.Unsetenv("HISTORY_HTTP_PORT")
	}()
	os.Unsetenv("HISTORY_GRPC_PORT")

	_, err := load()
	if err == nil {
		t.Fatal("esperaba error por GRPC_PORT faltante")
	}
}

func TestLoad_FaltaHTTPPort(t *testing.T) {
	os.Setenv("HISTORY_DB_HOST", "host")
	os.Setenv("HISTORY_DB_NAME", "db")
	os.Setenv("HISTORY_DB_USER", "user")
	os.Setenv("HISTORY_DB_PASS", "pass")
	os.Setenv("HISTORY_DB_PORT", "5432")
	os.Setenv("HISTORY_GRPC_PORT", "50055")
	defer func() {
		os.Unsetenv("HISTORY_DB_HOST")
		os.Unsetenv("HISTORY_DB_NAME")
		os.Unsetenv("HISTORY_DB_USER")
		os.Unsetenv("HISTORY_DB_PASS")
		os.Unsetenv("HISTORY_DB_PORT")
		os.Unsetenv("HISTORY_GRPC_PORT")
		os.Unsetenv("HISTORY_HTTP_PORT")
	}()
	os.Unsetenv("HISTORY_HTTP_PORT")

	_, err := load()
	if err == nil {
		t.Fatal("esperaba error por HTTP_PORT faltante")
	}
}
