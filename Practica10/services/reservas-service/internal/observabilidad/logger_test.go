// HeinzGomez - Práctica 10: pruebas del logger estructurado del servicio.
package observabilidad

import (
	"bytes"
	"io"
	"log/slog"
	"os"
	"strings"
	"testing"
)

func TestNivelLeido_DetectaLosNivelesYUsaInfoComoDefecto(t *testing.T) {
	casos := map[string]slog.Level{
		"debug":   slog.LevelDebug,
		"info":    slog.LevelInfo,
		"":        slog.LevelInfo,
		"basura":  slog.LevelInfo,
		"warn":    slog.LevelWarn,
		"warning": slog.LevelWarn,
		"error":   slog.LevelError,
		"INFO":    slog.LevelInfo,
	}
	for entrada, esperado := range casos {
		if got := NivelLeido(entrada); got != esperado {
			t.Errorf("NivelLeido(%q)=%v, se esperaba %v", entrada, got, esperado)
		}
	}
}

func TestVersionLeida_DefectoYValorExplicito(t *testing.T) {
	if got := VersionLeida(""); got != "1.0.0" {
		t.Errorf("sin SERVICE_VERSION se espera 1.0.0, llegó %q", got)
	}
	if got := VersionLeida("2.3.1"); got != "2.3.1" {
		t.Errorf("SERVICE_VERSION=2.3.1 debe respetarse, llegó %q", got)
	}
}

func TestNuevoLogger_EscribeJSONConElSelloDelServicio(t *testing.T) {
	var buf bytes.Buffer
	log := NuevoLogger(slog.LevelInfo, "2.0.0", &buf)
	log.Info("worker atendiendo petición", "worker", 1, "cola", "reservas.solicitudes")

	salida := buf.String()
	for _, esperado := range []string{
		`"msg":"worker atendiendo petición"`,
		`"servicio":"reservas-service"`,
		`"version":"2.0.0"`,
		`"level":"INFO"`,
		`"cola":"reservas.solicitudes"`,
	} {
		if !strings.Contains(salida, esperado) {
			t.Errorf("el log JSON debe contener %s; salió: %s", esperado, salida)
		}
	}
}

func TestNuevoLogger_FiltraSegunElNivel(t *testing.T) {
	var buf bytes.Buffer
	log := NuevoLogger(slog.LevelInfo, "1.0.0", &buf)

	log.Debug("detalle que no debe pasar")
	if buf.Len() != 0 {
		t.Errorf("con nivel info el debug no debe escribirse: %s", buf.String())
	}
	log.Error("gravedad que sí debe pasar")
	if !strings.Contains(buf.String(), "gravedad") {
		t.Errorf("el error debe escribirse: %s", buf.String())
	}
}

func TestNuevoLogger_DestinoNuloVaAStdout(t *testing.T) {
	anterior := os.Stdout
	lectura, escritura, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	os.Stdout = escritura
	log := NuevoLogger(slog.LevelInfo, "1.0.0", nil)
	log.Info("por stdout")
	os.Stdout = anterior
	escritura.Close()
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, lectura); err != nil {
		t.Fatal(err)
	}
	lectura.Close()

	if !strings.Contains(buf.String(), "por stdout") {
		t.Errorf("sin destino explícito el log debe ir a stdout; salió: %s", buf.String())
	}
}

func TestLoggerSilencioso_NoExplosivo(t *testing.T) {
	log := LoggerSilencioso()
	if log == nil {
		t.Fatal("LoggerSilencioso no debe ser nil")
	}
	log.Info("silencio", "clave", "valor") // no debe escribir ni paniquear
}
