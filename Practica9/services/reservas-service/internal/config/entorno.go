// HeinzGomez - Práctica 9: lectura centralizada de variables de entorno (SRP: un solo lugar lee os.Getenv)
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
}

func LeerEntorno() Entorno {
	return Entorno{
		DatabaseURL: obtener("DATABASE_URL", "postgres://academix:academix@localhost:5432/reservas_db?sslmode=disable"),
		RedisAddr:   obtener("REDIS_ADDR", "localhost:6379"),
		RabbitmqURL: obtener("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		Workers:     entero("WORKERS", 4),
		RPCPrefetch: entero("RPC_PREFETCH", 20),
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
