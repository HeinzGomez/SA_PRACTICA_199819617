package config

import (
	"os"
	"sync"
	"testing"
)

func TestDSN(t *testing.T) {
	cfg := DatabaseConfig{Host: "localhost", Port: 5432, Name: "testdb", User: "admin", Pass: "secret"}
	dsn := cfg.DSN()
	expected := "host=localhost port=5432 dbname=testdb user=admin password=secret sslmode=disable"
	if dsn != expected {
		t.Fatalf("DSN incorrecto:\nesperaba: %s\nobtuvo:  %s", expected, dsn)
	}
}

func TestRequired_ConValor(t *testing.T) {
	os.Setenv("TEST_RC_VAR", "hello")
	defer os.Unsetenv("TEST_RC_VAR")
	val, err := required("TEST_RC_VAR")
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if val != "hello" {
		t.Fatalf("esperaba 'hello', obtuvo %q", val)
	}
}

func TestRequired_SinValor(t *testing.T) {
	os.Unsetenv("TEST_RC_MISSING")
	_, err := required("TEST_RC_MISSING")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRequiredInt_ConValor(t *testing.T) {
	os.Setenv("TEST_RC_INT", "42")
	defer os.Unsetenv("TEST_RC_INT")
	val, err := requiredInt("TEST_RC_INT")
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if val != 42 {
		t.Fatalf("esperaba 42, obtuvo %d", val)
	}
}

func TestRequiredInt_NoNumerico(t *testing.T) {
	os.Setenv("TEST_RC_INT_BAD", "abc")
	defer os.Unsetenv("TEST_RC_INT_BAD")
	_, err := requiredInt("TEST_RC_INT_BAD")
	if err == nil {
		t.Fatal("esperaba error de parseo")
	}
}

func TestRequiredInt_SinValor(t *testing.T) {
	_, err := requiredInt("TEST_RC_INT_MISSING")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLoad_TodoConfigurado(t *testing.T) {
	configOnce = *new(sync.Once)
	config = nil
	configErr = nil

	env := map[string]string{
		"RESOURCE_DB_HOST":   "localhost",
		"RESOURCE_DB_PORT":   "5432",
		"RESOURCE_DB_NAME":   "testdb",
		"RESOURCE_DB_USER":   "user",
		"RESOURCE_DB_PASS":   "pass",
		"RESOURCE_GRPC_PORT": "50052",
		"RESOURCE_HTTP_PORT": "8081",
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
	if cfg.Server.GRPCPort != 50052 {
		t.Fatalf("esperaba 50052, obtuvo %d", cfg.Server.GRPCPort)
	}
	if cfg.Server.HTTPPort != 8081 {
		t.Fatalf("esperaba 8081, obtuvo %d", cfg.Server.HTTPPort)
	}
}

func TestLoad_FaltanVariables(t *testing.T) {
	configOnce = *new(sync.Once)
	config = nil
	configErr = nil
	_, err := GetConfig()
	if err == nil {
		t.Fatal("esperaba error por variables faltantes")
	}
}

func TestGetConfig_Singleton(t *testing.T) {
	configOnce = *new(sync.Once)
	config = nil
	configErr = nil

	os.Setenv("RESOURCE_DB_HOST", "localhost")
	os.Setenv("RESOURCE_DB_PORT", "5432")
	os.Setenv("RESOURCE_DB_NAME", "testdb")
	os.Setenv("RESOURCE_DB_USER", "user")
	os.Setenv("RESOURCE_DB_PASS", "pass")
	os.Setenv("RESOURCE_GRPC_PORT", "50052")
	os.Setenv("RESOURCE_HTTP_PORT", "8081")
	defer func() {
		for _, k := range []string{"RESOURCE_DB_HOST", "RESOURCE_DB_PORT", "RESOURCE_DB_NAME",
			"RESOURCE_DB_USER", "RESOURCE_DB_PASS", "RESOURCE_GRPC_PORT", "RESOURCE_HTTP_PORT"} {
			os.Unsetenv(k)
		}
		configOnce = *new(sync.Once)
		config = nil
		configErr = nil
	}()

	c1, _ := GetConfig()
	c2, _ := GetConfig()
	if c1 != c2 {
		t.Fatal("esperaba singleton")
	}
}
