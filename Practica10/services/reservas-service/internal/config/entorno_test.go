// HeinzGomez - Práctica 10: pruebas de la lectura de variables de entorno.
package config_test

import (
	"testing"

	"github.com/academix/reservas-service/internal/config"
)

func TestLeerEntorno_Defectos(t *testing.T) {
	e := config.LeerEntorno()
	if e.DatabaseURL == "" || e.RedisAddr == "" || e.RabbitmqURL == "" {
		t.Errorf("las URLs por defecto no pueden quedar vacías: %+v", e)
	}
	if e.Workers != 4 || e.RPCPrefetch != 20 {
		t.Errorf("defectos inesperados: workers=%d prefetch=%d", e.Workers, e.RPCPrefetch)
	}
}

func TestLeerEntorno_LeeLasVariablesDefinidas(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://u:p@db:5432/x")
	t.Setenv("REDIS_ADDR", "cache:6379")
	t.Setenv("RABBITMQ_URL", "amqp://mq:5672/")
	t.Setenv("WORKERS", "8")
	t.Setenv("RPC_PREFETCH", "13")

	e := config.LeerEntorno()
	if e.DatabaseURL != "postgres://u:p@db:5432/x" ||
		e.RedisAddr != "cache:6379" ||
		e.RabbitmqURL != "amqp://mq:5672/" ||
		e.Workers != 8 || e.RPCPrefetch != 13 {
		t.Errorf("el entorno no refleja las variables definidas: %+v", e)
	}
}

func TestLeerEntorno_NumerosInvalidosUsanElDefecto(t *testing.T) {
	for _, v := range []string{"abc", "-5", "4a", " ", ""} {
		t.Setenv("WORKERS", v)
		t.Setenv("RPC_PREFETCH", v)
		e := config.LeerEntorno()
		if e.Workers != 4 {
			t.Errorf("WORKERS=%q debe caer al defecto 4, dio %d", v, e.Workers)
		}
		if e.RPCPrefetch != 20 {
			t.Errorf("RPC_PREFETCH=%q debe caer al defecto 20, dio %d", v, e.RPCPrefetch)
		}
	}
}

func TestLeerEntorno_CeroEsUnValorValido(t *testing.T) {
	t.Setenv("WORKERS", "0")
	t.Setenv("RPC_PREFETCH", "1")
	e := config.LeerEntorno()
	if e.Workers != 0 || e.RPCPrefetch != 1 {
		t.Errorf("cero debe aceptarse como valor explícito: %+v", e)
	}
}

func TestLeerEntorno_PuertoNivelYVersionPorDefecto(t *testing.T) {
	e := config.LeerEntorno()
	if e.Puerto != 8093 {
		t.Errorf("el puerto del servicio de observabilidad por defecto es 8093, dio %d", e.Puerto)
	}
	if e.LogLevel != "info" {
		t.Errorf("LOG_LEVEL por defecto info, dio %q", e.LogLevel)
	}
	if e.Version != "1.0.0" {
		t.Errorf("SERVICE_VERSION por defecto 1.0.0, dio %q", e.Version)
	}
}

func TestLeerEntorno_PuertoNivelYVersionDelEntorno(t *testing.T) {
	t.Setenv("PUERTO", "9999")
	t.Setenv("LOG_LEVEL", "debug")
	t.Setenv("SERVICE_VERSION", "3.1.4")

	e := config.LeerEntorno()
	if e.Puerto != 9999 || e.LogLevel != "debug" || e.Version != "3.1.4" {
		t.Errorf("el entorno debe reflejar las variables: %+v", e)
	}
}

func TestLeerEntorno_PuertoInvalidoCaeAlDefecto(t *testing.T) {
	for _, v := range []string{"abc", "-1", "80x", ""} {
		t.Setenv("PUERTO", v)
		if pu := config.LeerEntorno().Puerto; pu != 8093 {
			t.Errorf("PUERTO=%q debe caer al defecto 8093, dio %d", v, pu)
		}
	}
}
