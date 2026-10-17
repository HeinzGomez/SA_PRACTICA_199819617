// HeinzGomez - Práctica 10: lectura centralizada de variables de entorno (SRP: un solo lugar lee os.Getenv)
package config

import "os"

type Entorno struct {
	DatabaseURL string
	RedisAddr   string
	RabbitmqURL string
	Workers     int
	// RPCPrefetch es la cantidad de peticiones del gateway que un proceso atiende a la vez
	// (sin ACK no se entregan más: back-pressure sobre la cola).
	RPCPrefetch int
	// Puerto del servidor de observabilidad (/health, /health/ready, /metrics).
	Puerto int
	// Nivel de log (LOG_LEVEL) y versión del servicio (SERVICE_VERSION) para los sellos.
	LogLevel string
	Version  string
}

func LeerEntorno() Entorno {
	return Entorno{
		DatabaseURL: obtener("DATABASE_URL", "postgres://academix:academix@localhost:5432/reservas_db?sslmode=disable"),
		RedisAddr:   obtener("REDIS_ADDR", "localhost:6379"),
		RabbitmqURL: obtener("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		Workers:     entero("WORKERS", 4),
		RPCPrefetch: entero("RPC_PREFETCH", 20),
		Puerto:      entero("PUERTO", 8093),
		LogLevel:    obtener("LOG_LEVEL", "info"),
		Version:     obtener("SERVICE_VERSION", "1.0.0"),
	}
}

func obtener(clave, defecto string) string {
	if v := os.Getenv(clave); v != "" {
		return v
	}
	return defecto
}

func entero(clave string, defecto int) int {
	if v := os.Getenv(clave); v != "" {
		var n int
		for _, c := range v {
			if c < '0' || c > '9' {
				return defecto
			}
			n = n*10 + int(c-'0')
		}
		return n
	}
	return defecto
}
