// HeinzGomez - Práctica 10: pruebas del healthcheck del contenedor (subcomando del binario).
package observabilidad_test

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/observabilidad"
)

func TestSondearSalud_ContraUnServidorVivoNoFalla(t *testing.T) {
	s := observabilidad.NuevoServidorAtencion(0, observabilidad.NuevoMetricas(), observabilidad.Sondas{}, "1.0.0")
	puerto, err := s.Iniciar()
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_ = s.Detener(ctx)
	}()

	if err := observabilidad.SondearSalud(puerto); err != nil {
		t.Errorf("con el servicio arriba el healthcheck debe pasar: %v", err)
	}
}

func TestSondearSalud_PuertoCerradoFalla(t *testing.T) {
	// Toma un puerto libre y lo suelta inmediatamente.
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	puerto := listener.Addr().(*net.TCPAddr).Port
	listener.Close()

	if err := observabilidad.SondearSalud(puerto); err == nil {
		t.Error("sin proceso escuchando el healthcheck debe fallar (exit 1)")
	}
}

func TestSondearSalud_RespuestaNoOkSeConsideraFalla(t *testing.T) {
	falso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer falso.Close()

	u, err := url.Parse(falso.URL)
	if err != nil {
		t.Fatal(err)
	}
	_, puertoTexto, err := net.SplitHostPort(u.Host)
	if err != nil {
		t.Fatal(err)
	}
	puerto, err := strconv.Atoi(puertoTexto)
	if err != nil {
		t.Fatal(err)
	}

	if err := observabilidad.SondearSalud(puerto); err == nil {
		t.Error("un 503 en /health debe producir error")
	}
}
