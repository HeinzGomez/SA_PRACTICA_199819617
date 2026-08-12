package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config centraliza las variables de entorno del microservicio.
// La informacion sensible (credenciales de BD) NUNCA se hardcodea:
// siempre se lee desde el archivo .env (ver .env.example), que no
// se sube al repositorio.
type Config struct {
	GRPCPort   string
	HTTPPort   string
	DBHost     string
	DBPort     string
	DBName     string
	DBUser     string
	DBPassword string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		GRPCPort:   getEnv("GRPC_PORT", "50052"),
		HTTPPort:   getEnv("HTTP_PORT", "8082"),
		DBHost:     getEnv("DB_HOST", "content-db"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBName:     getEnv("DB_NAME", "content_db"),
		DBUser:     getEnv("DB_USER", "content_user"),
		DBPassword: getEnv("DB_PASSWORD", "content_pass"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
