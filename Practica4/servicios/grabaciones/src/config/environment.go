package config

import (
	"fmt"
	"os"
	"strconv"
	"sync"
)

type DatabaseConfig struct {
	Host string
	Port int
	Name string
	User string
	Pass string
}

func (c DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=disable",
		c.Host, c.Port, c.Name, c.User, c.Pass,
	)
}

type ServerConfig struct {
	GRPCPort int
	HTTPPort int
}

type Config struct {
	DB     DatabaseConfig
	Server ServerConfig
}

var (
	configOnce sync.Once
	config     *Config
	configErr  error
)

func required(key string) (string, error) {
	value := os.Getenv(key)
	if value == "" {
		return "", fmt.Errorf("la variable de entorno '%s' es requerida pero no está definida", key)
	}
	return value, nil
}

func requiredInt(key string) (int, error) {
	value, err := required(key)
	if err != nil {
		return 0, err
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("la variable de entorno '%s' debe ser un número entero", key)
	}
	return parsed, nil
}

func load() (*Config, error) {
	cfg := &Config{}

	values := map[string]*string{
		"GRAB_DB_HOST": &cfg.DB.Host,
		"GRAB_DB_NAME": &cfg.DB.Name,
		"GRAB_DB_USER": &cfg.DB.User,
		"GRAB_DB_PASS": &cfg.DB.Pass,
	}

	for key, dest := range values {
		value, err := required(key)
		if err != nil {
			return nil, err
		}
		*dest = value
	}

	dbPort, err := requiredInt("GRAB_DB_PORT")
	if err != nil {
		return nil, err
	}
	cfg.DB.Port = dbPort

	grpcPort, err := requiredInt("GRAB_GRPC_PORT")
	if err != nil {
		return nil, err
	}
	cfg.Server.GRPCPort = grpcPort

	httpPort, err := requiredInt("GRAB_HTTP_PORT")
	if err != nil {
		return nil, err
	}
	cfg.Server.HTTPPort = httpPort

	return cfg, nil
}

func GetConfig() (*Config, error) {
	configOnce.Do(func() {
		config, configErr = load()
	})
	return config, configErr
}
