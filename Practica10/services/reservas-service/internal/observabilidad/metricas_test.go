// HeinzGomez - Práctica 10: pruebas de las métricas Prometheus del servicio.
// Paquete interno para poder leer los colectores directamente con testutil.
package observabilidad

import (
	"testing"

	"github.com/prometheus/client_golang/prometheus/testutil"
)

const cola = "reservas.solicitudes"

// ejercitar deja una serie de cada métrica (los CounterVec solo aparecen con un valor).
func ejercitar(m *Metricas) {
	m.MensajeRecibido(cola)
	m.MensajeProcesado(cola, "procesado", 0.01)
	m.ReservaResuelta("CONFIRMADA")
	m.RPC("reservas.consultar_ticket", "ok", 0.01)
	m.Broker(true)
}

func TestNuevoMetricas_RegistraLasSieteMetricasDelServicio(t *testing.T) {
	m := NuevoMetricas()
	ejercitar(m)

	familias, err := m.Registro.Gather()
	if err != nil {
		t.Fatal(err)
	}
	nombres := map[string]bool{}
	for _, f := range familias {
		nombres[f.GetName()] = true
	}
	for _, esperado := range []string{
		"academix_worker_messages_total",
		"academix_worker_processing_duration_seconds",
		"academix_worker_in_flight",
		"academix_worker_reservas_total",
		"academix_rpc_calls_total",
		"academix_rpc_duration_seconds",
		"academix_broker_connected",
	} {
		if !nombres[esperado] {
			t.Errorf("falta la métrica %s en el registro", esperado)
		}
	}
}

func TestMensajes_RecibidoProcesadoDejaElGaugeEnCero(t *testing.T) {
	m := NuevoMetricas()

	m.MensajeRecibido(cola)
	if v := testutil.ToFloat64(m.enVuelo); v != 1 {
		t.Errorf("al recibir, in_flight debe ser 1, dio %v", v)
	}
	if v := testutil.ToFloat64(m.mensajes.WithLabelValues(cola, "recibido")); v != 1 {
		t.Errorf("contador recibido=1, dio %v", v)
	}

	m.MensajeProcesado(cola, "procesado", 0.05)
	if v := testutil.ToFloat64(m.enVuelo); v != 0 {
		t.Errorf("al procesar, in_flight debe volver a 0, dio %v", v)
	}
	if v := testutil.ToFloat64(m.mensajes.WithLabelValues(cola, "procesado")); v != 1 {
		t.Errorf("contador procesado=1, dio %v", v)
	}
	if v := testutil.ToFloat64(m.mensajes.WithLabelValues(cola, "error")); v != 0 {
		t.Errorf("la etiqueta error no debe moverse, dio %v", v)
	}
}

func TestMensajes_DevuelveElGaugeACeroAunqueHayErrores(t *testing.T) {
	m := NuevoMetricas()
	m.MensajeRecibido(cola)
	m.MensajeProcesado(cola, "error", 0.02)
	if v := testutil.ToFloat64(m.enVuelo); v != 0 {
		t.Errorf("in_flight=0 tras terminar, dio %v", v)
	}
	if v := testutil.ToFloat64(m.mensajes.WithLabelValues(cola, "error")); v != 1 {
		t.Errorf("contador de error=1, dio %v", v)
	}
}

func TestReservaResuelta_CuentaPorResultadoDeNegocio(t *testing.T) {
	m := NuevoMetricas()
	m.ReservaResuelta("CONFIRMADA")
	m.ReservaResuelta("CONFIRMADA")
	m.ReservaResuelta("RECHAZADA")

	if v := testutil.ToFloat64(m.reservas.WithLabelValues("CONFIRMADA")); v != 2 {
		t.Errorf("confirmadas=2, dio %v", v)
	}
	if v := testutil.ToFloat64(m.reservas.WithLabelValues("RECHAZADA")); v != 1 {
		t.Errorf("rechazadas=1, dio %v", v)
	}
}

func TestRPC_CuentaOperacionesPorEstado(t *testing.T) {
	m := NuevoMetricas()
	m.RPC("reservas.solicitar", "ok", 0.01)
	m.RPC("reservas.consultar_ticket", "error", 0.02)

	if v := testutil.ToFloat64(m.rpc.WithLabelValues("reservas.solicitar", "ok")); v != 1 {
		t.Errorf("ok=1, dio %v", v)
	}
	if v := testutil.ToFloat64(m.rpc.WithLabelValues("reservas.consultar_ticket", "error")); v != 1 {
		t.Errorf("error=1, dio %v", v)
	}
	// El histograma de duración debe tener al menos una serie expuesta.
	if n, err := testutil.GatherAndCount(m.Registro, "academix_rpc_duration_seconds"); err != nil || n < 1 {
		t.Errorf("academix_rpc_duration_seconds debe exponerse: n=%d err=%v", n, err)
	}
}

func TestBroker_ActualizaElGaugeDeConexion(t *testing.T) {
	m := NuevoMetricas()
	if v := testutil.ToFloat64(m.broker); v != 0 {
		t.Errorf("al construir la métrica debe arrancar en 0, dio %v", v)
	}
	m.Broker(true)
	if v := testutil.ToFloat64(m.broker); v != 1 {
		t.Errorf("conectado debe marcar 1, dio %v", v)
	}
	m.Broker(false)
	if v := testutil.ToFloat64(m.broker); v != 0 {
		t.Errorf("desconectado debe volver a 0, dio %v", v)
	}
}
