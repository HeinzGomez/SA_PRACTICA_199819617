// HeinzGomez - Práctica 9: pruebas del ensamblador (composición) del servicio.
//
// main() levanta PostgreSQL, Redis y RabbitMQ reales, así que no es unit-testeable;
// aquí se cubre conReintentos, que es la lógica de tolerancia a fallos del arranque.
package main

import (
	"errors"
	"testing"
)

func TestConReintentos_DevuelveElValorEnElPrimerIntento(t *testing.T) {
	llamadas := 0
	got := conReintentos("ok", func() (int, error) {
		llamadas++
		return 42, nil
	})
	if got != 42 || llamadas != 1 {
		t.Errorf("got=%d llamadas=%d, se esperaba 42 en un solo intento", got, llamadas)
	}
}

func TestConReintentos_ReintentaHastaQueFuncione(t *testing.T) {
	primera := true
	got := conReintentos("flaky", func() (string, error) {
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
