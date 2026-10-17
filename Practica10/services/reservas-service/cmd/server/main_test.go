// HeinzGomez - Práctica 10: pruebas del ensamblador (composición) del servicio.
//
// main() levanta PostgreSQL, Redis y RabbitMQ reales, así que no es unit-testeable;
// aquí se cubre conReintentos, que es la lógica de tolerancia a fallos del arranque.
package main

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/config"
	"github.com/academix/reservas-service/internal/observabilidad"
)

func logPrueba() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestConReintentos_DevuelveElValorEnElPrimerIntento(t *testing.T) {
	llamadas := 0
	got := conReintentos(logPrueba(), "ok", func() (int, error) {
		llamadas++
		return 42, nil
	})
	if got != 42 || llamadas != 1 {
		t.Errorf("got=%d llamadas=%d, se esperaba 42 en un solo intento", got, llamadas)
	}
}

func TestConReintentos_ReintentaHastaQueFuncione(t *testing.T) {
	primera := true
	got := conReintentos(logPrueba(), "flaky", func() (string, error) {
		if primera {
			primera = false
			return "", errors.New("aún no está listo")
		}
		return "servicio", nil
	})
	if got != "servicio" {
		t.Errorf("se esperaba 'servicio' tras reintentar, llegó %q", got)
	}
	if primera {
		t.Error("el primer intento no falló, la ramita de reintento no se cubrió")
	}
}

func TestHealthcheck_ContraUnProcesoVivoDevuelveCero(t *testing.T) {
	m := observabilidad.NuevoMetricas()
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

	if codigo := healthcheck(config.Entorno{Puerto: puerto}); codigo != 0 {
		t.Errorf("con el servicio arriba el healthcheck debe dar exit 0, dio %d", codigo)
	}
}

func TestHealthcheck_SinProcesoDevuelveUno(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	puerto := listener.Addr().(*net.TCPAddr).Port
	listener.Close()

	if codigo := healthcheck(config.Entorno{Puerto: puerto}); codigo != 1 {
		t.Errorf("sin proceso vivo debe dar exit 1, dio %d", codigo)
	}
}
