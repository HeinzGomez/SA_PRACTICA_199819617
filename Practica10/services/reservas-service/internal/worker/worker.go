// HeinzGomez - Práctica 10: el worker propiamente dicho de la cola "reservas.solicitudes".
//
// Un worker es el empleado que toma un ticket de la cola y lo atiende:
//
//	suscribirse (sin hacer polling: el broker entrega por canal) ->
//	recibir mensaje  ->  "worker atendiendo petición"
//	ejecutar la lógica de negocio (Procesador, reutilizando repositorios/servicios)
//	-> ACK   "worker respondió petición"   (o NACK -> DLQ en error, "worker falló la petición")
//	volver a esperar
//
// La conexión y el ACK/NACK viven en internal/broker; la lógica de negocio en
// Procesador; aquí solo se orquesta el ciclo y se deja constancia (log + métricas)
// de que cada petición fue recibida y procesada.
package worker

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/academix/reservas-service/internal/domain"
)

// Telemetria registra la actividad del worker. La implementa observabilidad.Metricas;
// el worker solo conoce esta interfaz (DIP) y en las pruebas se inyecta un doble.
type Telemetria interface {
	MensajeRecibido(cola string)
	MensajeProcesado(cola, status string, segundos float64)
	ReservaResuelta(resultado string)
}

// SinTelemetria se inyecta cuando no se quieren métricas (pruebas ligeras).
type SinTelemetria struct{}

func (SinTelemetria) MensajeRecibido(string)                   {}
func (SinTelemetria) MensajeProcesado(string, string, float64) {}
func (SinTelemetria) ReservaResuelta(string)                   {}

// Worker atiende la cola de solicitudes: decodifica, delega en el Procesador
// (la lógica de negocio ya existente, sin duplicarla) y registra el ciclo completo.
type Worker struct {
	ID   int
	cola string
	proc *Procesador
	log  *slog.Logger
	tel  Telemetria
	now  func() time.Time
}

// colaSolicitudes es la cola que consumen los workers (la declara internal/broker).
const colaSolicitudes = "reservas.solicitudes"

// Prefetch es el máximo de mensajes sin confirmar que el broker entrega a cada worker
// (back-pressure: sin ACK no llegan más).
const Prefetch = 20

func Nuevo(id int, proc *Procesador, log *slog.Logger, tel Telemetria) *Worker {
	if tel == nil {
		tel = SinTelemetria{}
	}
	return &Worker{ID: id, cola: colaSolicitudes, proc: proc, log: log, tel: tel, now: time.Now}
}

// Atender procesa un mensaje de la cola. Devuelve nil => ACK; error => NACK a la DLQ.
// Es la función que el consumidor del broker invoca por cada entrega.
func (w *Worker) Atender(ctx context.Context, body []byte) error {
	var msg domain.MensajeReserva
	if err := json.Unmarshal(body, &msg); err != nil {
		w.log.Error("worker descartó petición",
			"worker", w.ID, "cola", w.cola, "motivo", "json inválido", "error", err)
		w.tel.MensajeRecibido(w.cola)
		w.tel.MensajeProcesado(w.cola, "invalido", 0)
		return err
	}

	w.tel.MensajeRecibido(w.cola)
	w.log.Info("worker atendiendo petición",
		"worker", w.ID, "cola", w.cola,
		"ticket", msg.TicketID, "evento", msg.EventoID, "usuario", msg.UsuarioID)

	inicio := w.now()
	t, err := w.proc.Procesar(ctx, msg)
	segundos := w.now().Sub(inicio).Seconds()

	if err != nil {
		w.tel.MensajeProcesado(w.cola, "error", segundos)
		w.log.Error("worker falló la petición",
			"worker", w.ID, "cola", w.cola, "ticket", msg.TicketID,
			"error", err, "duracion_s", segundos, "resultado", "nack-dlq")
		return err
	}

	w.tel.MensajeProcesado(w.cola, "procesado", segundos)
	w.tel.ReservaResuelta(string(t.Estado))
	w.log.Info("worker respondió petición",
		"worker", w.ID, "cola", w.cola,
		"ticket", t.ID, "estado", t.Estado, "motivo", t.Motivo, "cupo_restante", t.CupoRestante,
		"duracion_s", segundos, "resultado", "ack")
	return nil
}
