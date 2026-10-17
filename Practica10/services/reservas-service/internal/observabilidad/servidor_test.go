// HeinzGomez - Práctica 10: pruebas del servidor de observabilidad
// (/health, /health/ready y /metrics) con puerto efímero.
package observabilidad_test

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/observabilidad"
)

func responder(_ context.Context) error { return nil }
func fallar(_ context.Context) error    { return errorDown{} }

type errorDown struct{}

func (errorDown) Error() string { return "dependencia caída" }

func iniciar(t *testing.T, sondas observabilidad.Sondas) int {
	t.Helper()
	s := observabilidad.NuevoServidorAtencion(0, observabilidad.NuevoMetricas(), sondas, "1.0.0")
	puerto, err := s.Iniciar()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = s.Detener(ctx)
	})
	return puerto
}

func get(t *testing.T, puerto int, ruta string) (int, string) {
	t.Helper()
	respuesta, err := http.Get("http://127.0.0.1:" + strconv.Itoa(puerto) + ruta)
	if err != nil {
		t.Fatalf("GET %s: %v", ruta, err)
	}
	defer respuesta.Body.Close()
	cuerpo, err := io.ReadAll(respuesta.Body)
	if err != nil {
		t.Fatal(err)
	}
	return respuesta.StatusCode, string(cuerpo)
}

func TestLiveness_SiempreResponde200AunqueTodoCae(t *testing.T) {
	puerto := iniciar(t, observabilidad.Sondas{Postgres: fallar, Redis: fallar, Broker: func() error { return errorDown{} }})
	codigo, cuerpo := get(t, puerto, "/health")
	if codigo != http.StatusOK {
		t.Errorf("/health debe ser 200 siempre, dio %d", codigo)
	}
	var r map[string]any
	if err := json.Unmarshal([]byte(cuerpo), &r); err != nil {
		t.Fatalf("la respuesta no es JSON: %v (%s)", err, cuerpo)
	}
	if r["status"] != "ok" {
		t.Errorf("status=ok esperado, llegó %v", r["status"])
	}
	sello, _ := r["sello"].(map[string]any)
	if sello == nil || sello["servicio"] != "reservas-service" || sello["version"] != "1.0.0" {
		t.Errorf("falta el sello del servicio: %v", r["sello"])
	}
}

func TestReadiness_200CuandoLasTresDependenciasResponden(t *testing.T) {
	puerto := iniciar(t, observabilidad.Sondas{Postgres: responder, Redis: responder, Broker: func() error { return nil }})
	codigo, cuerpo := get(t, puerto, "/health/ready")
	if codigo != http.StatusOK {
		t.Errorf("con todo arriba readiness debe ser 200, dio %d (%s)", codigo, cuerpo)
	}
	var r map[string]any
	_ = json.Unmarshal([]byte(cuerpo), &r)
	if r["status"] != "ready" {
		t.Errorf("status=ready esperado, llegó %v", r["status"])
	}
	for _, dependencia := range []string{"postgres", "redis", "broker"} {
		if r[dependencia] != "ok" {
			t.Errorf("%s debe estar ok, llegó %v", dependencia, r[dependencia])
		}
	}
}

func TestReadiness_503SiAlgoCae_DejaElEstadoCulpa(t *testing.T) {
	puerto := iniciar(t, observabilidad.Sondas{
		Postgres: responder,
		Redis:    responder,
		Broker:   func() error { return errorDown{} },
	})
	codigo, cuerpo := get(t, puerto, "/health/ready")
	if codigo != http.StatusServiceUnavailable {
		t.Errorf("con el broker caído debe ser 503, dio %d", codigo)
	}
	var r map[string]any
	_ = json.Unmarshal([]byte(cuerpo), &r)
	if r["status"] != "not_ready" || r["broker"] != "down" || r["postgres"] != "ok" {
		t.Errorf("estados inesperados: %v", r)
	}
}

func TestReadiness_SondasSinInyectarQuedanNoVerificadas(t *testing.T) {
	puerto := iniciar(t, observabilidad.Sondas{})
	codigo, cuerpo := get(t, puerto, "/health/ready")
	if codigo != http.StatusOK {
		t.Errorf("sin sondas no debe bloquear: dio %d", codigo)
	}
	var r map[string]any
	_ = json.Unmarshal([]byte(cuerpo), &r)
	if r["postgres"] != "no-verificado" || r["broker"] != "no-verificado" {
		t.Errorf("las sondas ausentes deben marcar no-verificado: %v", r)
	}
}

func TestMetrics_ExpoenLasMetricasDelServicio(t *testing.T) {
	m := observabilidad.NuevoMetricas()
	m.MensajeRecibido("reservas.solicitudes")
	s := observabilidad.NuevoServidorAtencion(0, m, observabilidad.Sondas{}, "1.0.0")
	puerto, err := s.Iniciar()
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = s.Detener(ctx)
	}()

	respuesta, err := http.Get("http://127.0.0.1:" + strconv.Itoa(puerto) + "/metrics")
	if err != nil {
		t.Fatal(err)
	}
	defer respuesta.Body.Close()
	cuerpo, _ := io.ReadAll(respuesta.Body)

	if respuesta.StatusCode != http.StatusOK {
		t.Errorf("/metrics debe ser 200, dio %d", respuesta.StatusCode)
	}
	if ct := respuesta.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/plain") {
		t.Errorf("el scrape espera text/plain, llegó %q", ct)
	}
	for _, esperado := range []string{
		"academix_worker_messages_total",
		"academix_worker_in_flight",
		"go_goroutines",
	} {
		if !strings.Contains(string(cuerpo), esperado) {
			t.Errorf("/metrics debe exponer %s", esperado)
		}
	}
}

func TestIniciar_ESIdempotenteYDetenerTambien(t *testing.T) {
	m := observabilidad.NuevoMetricas()
	s := observabilidad.NuevoServidorAtencion(0, m, observabilidad.Sondas{}, "1.0.0")

	if err := s.Detener(context.Background()); err != nil {
		t.Errorf("Detener sin Iniciar no debe fallar: %v", err)
	}
	puerto1, err := s.Iniciar()
	if err != nil {
		t.Fatal(err)
	}
	puerto2, err := s.Iniciar()
	if err != nil || puerto2 != puerto1 {
		t.Errorf("Iniciar repetido debe devolver el mismo puerto: %d vs %d (err=%v)", puerto1, puerto2, err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	if err := s.Detener(ctx); err != nil {
		t.Errorf("Detener: %v", err)
	}
	if err := s.Detener(ctx); err != nil {
		t.Errorf("Detener debe ser idempotente: %v", err)
	}
	// Tras detener, el puerto queda libre: una conexión rechaza.
	if _, err := net.DialTimeout("tcp", "127.0.0.1:"+strconv.Itoa(puerto1), 200*time.Millisecond); err == nil {
		t.Error("tras Detener el puerto no debe seguir aceptando")
	}
}
