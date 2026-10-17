// HeinzGomez - Práctica 10: observabilidad del Servicio de Reservas (logs + métricas + salud).
package observabilidad

import (
	"io"
	"log/slog"
	"os"
	"strings"
)

// NivelLeido traduce LOG_LEVEL a un nivel slog (debug|info|warn|error, por defecto info).
func NivelLeido(env string) slog.Level {
	switch strings.ToLower(env) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// VersionLeida lee SERVICE_VERSION (por defecto 1.0.0).
func VersionLeida(env string) string {
	if env == "" {
		return "1.0.0"
	}
	return env
}

// NuevoLogger crea un logger JSON por stdout con el sello del servicio.
// `destino` permite capturar la salida en pruebas (io.Discard para silenciarlas).
func NuevoLogger(nivel slog.Level, version string, destino io.Writer) *slog.Logger {
	if destino == nil {
		destino = os.Stdout
	}
	manejador := slog.NewJSONHandler(destino, &slog.HandlerOptions{Level: nivel})
	return slog.New(manejador).With("servicio", "reservas-service", "version", version)
}

// LoggerSilencioso se inyecta en las pruebas: mismo contrato, cero salida.
func LoggerSilencioso() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}
