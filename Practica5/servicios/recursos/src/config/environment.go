package config

import "fmt"

// DatabaseConfig agrupa los datos de conexión a PostgreSQL.
type DatabaseConfig struct {
	Host string
	Port int
	Name string
	User string
	Pass string
}

// DSN construye la cadena de conexión compatible con lib/pq.
func (c DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=disable",
		c.Host, c.Port, c.Name, c.User, c.Pass,
	)
}

// ServerConfig agrupa los puertos del microservicio.
type ServerConfig struct {
	GRPCPort int
	HTTPPort int
}

// Config es la configuración completa del microservicio.
type Config struct {
	DB     DatabaseConfig
	Server ServerConfig
}
