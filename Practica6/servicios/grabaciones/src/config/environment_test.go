package config

import (
	"os"
	"sync"
	"testing"
)

func TestDatabaseConfig_DSN(t *testing.T) {
	cfg := DatabaseConfig{Host: "localhost", Port: 5432, Name: "testdb", User: "admin", Pass: "secret"}
	dsn := cfg.DSN()
	expected := "host=localhost port=5432 dbname=testdb user=admin password=secret sslmode=disable"
	if dsn != expected {
		t.Fatalf("DSN incorrecto:\nesperaba: %s\nobtuvo:  %s", expected, dsn)
	}
}

func TestRequired_Existe(t *testing.T) {
	os.Setenv("TEST_VAR_EXIST", "hello")
	defer os.Unsetenv("TEST_VAR_EXIST")
	val, err := required("TEST_VAR_EXIST")
	if err != nil {
		t.Fatalf("no esperaba error, obtuvo: %v", err)
	}
	if val != "hello" {
		t.Fatalf("esperaba 'hello', obtuvo %q", val)
	}
}

func TestRequired_NoExiste(t *testing.T) {
	os.Unsetenv("TEST_VAR_MISSING")
	_, err := required("TEST_VAR_MISSING")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRequiredInt_Invalido(t *testing.T) {
	os.Setenv("TEST_VAR_NOTINT", "abc")
	defer os.Unsetenv("TEST_VAR_NOTINT")
	_, err := requiredInt("TEST_VAR_NOTINT")
	if err == nil {
		t.Fatal("esperaba error de parseo")
	}
}

func TestGetConfig_FaltanVariables(t *testing.T) {
	// Limpiar cualquier config previa
	configOnce = *new(sync.Once)
	config = nil
	configErr = nil
	_, err := GetConfig()
	if err == nil {
		t.Fatal("esperaba error por variables faltantes")
	}
}

func TestLoad_TodoConfigurado(t *testing.T) {
	configOnce = *new(sync.Once)
	config = nil
	configErr = nil

	env := map[string]string{
		"GRAB_DB_HOST":   "localhost",
		"GRAB_DB_PORT":   "5432",
		"GRAB_DB_NAME":   "testdb",
		"GRAB_DB_USER":   "user",
		"GRAB_DB_PASS":   "pass",
		"GRAB_GRPC_PORT": "50051",
		"GRAB_HTTP_PORT": "8080",
	}
	for k, v := range env {
		os.Setenv(k, v)
	}
	defer func() {
		for k := range env {
			os.Unsetenv(k)
		}
		configOnce = *new(sync.Once)
		config = nil
		configErr = nil
	}()

	cfg, err := GetConfig()
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if cfg.DB.Host != "localhost" {
		t.Fatalf("esperaba localhost, obtuvo %s", cfg.DB.Host)
	}
	if cfg.Server.GRPCPort != 50051 {
		t.Fatalf("esperaba 50051, obtuvo %d", cfg.Server.GRPCPort)
	}
}

func TestRequiredInt_NoNumerico(t *testing.T) {
	os.Setenv("TEST_INT_BAD", "abc")
	defer os.Unsetenv("TEST_INT_BAD")
	_, err := requiredInt("TEST_INT_BAD")
	if err == nil {
		t.Fatal("esperaba error de parseo")
	}
}

func TestRequiredInt_ConValor(t *testing.T) {
	os.Setenv("TEST_INT_OK", "42")
	defer os.Unsetenv("TEST_INT_OK")
	val, err := requiredInt("TEST_INT_OK")
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if val != 42 {
		t.Fatalf("esperaba 42, obtuvo %d", val)
	}
}
