// HeinzGomez - Práctica 10: métricas Prometheus del Servicio de Reservas (client_golang).
//
// Registry propio del proceso (no se registra en el default de Go): evita colisiones
// si en el mismo proceso corriera otro colector y permite exponer solo lo nuestro.
package observabilidad

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
)

const colaSolicitudes = "reservas.solicitudes"

// Metricas concentra los contadores/histogramas del servicio y las interfaces que
// consumen worker, rpcapi y broker (DIP: ellos no importan prometheus).
type Metricas struct {
	Registro *prometheus.Registry

	mensajes *prometheus.CounterVec // academix_worker_messages_total{queue,status}
	duracion prometheus.Histogram   // academix_worker_processing_duration_seconds
	enVuelo  prometheus.Gauge       // academix_worker_in_flight
	reservas *prometheus.CounterVec // academix_worker_reservas_total{resultado}
	rpc      *prometheus.CounterVec // academix_rpc_calls_total{operation,status}
	rpcDur   prometheus.Histogram   // academix_rpc_duration_seconds
	broker   prometheus.Gauge       // academix_broker_connected
}

func NuevoMetricas() *Metricas {
	registro := prometheus.NewRegistry()
	registro.MustRegister(
		collectors.NewGoCollector(),
		collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
	)

	m := &Metricas{
		Registro: registro,
		mensajes: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "academix_worker_messages_total",
			Help: "Mensajes de la cola de solicitudes atendidos por los workers",
		}, []string{"queue", "status"}),
		duracion: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "academix_worker_processing_duration_seconds",
			Help:    "Duracion del procesamiento de una solicitud en segundos",
			Buckets: prometheus.DefBuckets,
		}),
		enVuelo: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "academix_worker_in_flight",
			Help: "Solicitudes que los workers estan atendiendo en este momento",
		}),
		reservas: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "academix_worker_reservas_total",
			Help: "Reservas resueltas por el worker (resultado de negocio)",
		}, []string{"resultado"}),
		rpc: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "academix_rpc_calls_total",
			Help: "Operaciones RPC atendidas desde la cola reservas.rpc",
		}, []string{"operation", "status"}),
		rpcDur: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "academix_rpc_duration_seconds",
			Help:    "Duracion de las operaciones RPC en segundos",
			Buckets: prometheus.DefBuckets,
		}),
		broker: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "academix_broker_connected",
			Help: "Conexion con RabbitMQ (1 conectado, 0 desconectado)",
		}),
	}
	m.broker.Set(0)
	registro.MustRegister(m.mensajes, m.duracion, m.enVuelo, m.reservas, m.rpc, m.rpcDur, m.broker)
	return m
}

// --- worker.Telemetria ------------------------------------------------------

func (m *Metricas) MensajeRecibido(cola string) {
	m.enVuelo.Inc()
	m.mensajes.WithLabelValues(cola, "recibido").Inc()
}

func (m *Metricas) MensajeProcesado(cola, status string, segundos float64) {
	m.enVuelo.Dec()
	m.mensajes.WithLabelValues(cola, status).Inc()
	m.duracion.Observe(segundos)
}

func (m *Metricas) ReservaResuelta(resultado string) {
	m.reservas.WithLabelValues(resultado).Inc()
}

// --- rpcapi.Telemetria ------------------------------------------------------

func (m *Metricas) RPC(operacion, status string, segundos float64) {
	m.rpc.WithLabelValues(operacion, status).Inc()
	m.rpcDur.Observe(segundos)
}

// --- estado del broker ------------------------------------------------------

func (m *Metricas) Broker(conectado bool) {
	if conectado {
		m.broker.Set(1)
		return
	}
	m.broker.Set(0)
}
