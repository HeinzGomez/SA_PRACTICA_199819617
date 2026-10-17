// HeinzGomez - Práctica 10: pruebas del worker de la cola (ciclo completo + logs + métricas).
package worker_test

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"sync"
	"testing"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/worker"
)

// telWorker es el doble de worker.Telemetria: registra lo que el worker reporta.
type telWorker struct {
	mu         sync.Mutex
	recibidos  int
	procesados []string // status en orden
	reservas   []string // resultado de negocio en orden
}

func (t *telWorker) MensajeRecibido(string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.recibidos++
}

func (t *telWorker) MensajeProcesado(_, status string, _ float64) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.procesados = append(t.procesados, status)
}

func (t *telWorker) ReservaResuelta(resultado string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.reservas = append(t.reservas, resultado)
}

// nuevoWorkerCon arma un worker con logger a buffer y telemetria capturada.
func nuevoWorkerCon(e *entorno, tel worker.Telemetria) (*worker.Worker, *bytes.Buffer) {
	var buf bytes.Buffer
	log := slog.New(slog.NewJSONHandler(&buf, nil))
	return worker.Nuevo(0, e.proc, log, tel), &buf
}

func cuerpo(t *testing.T, m domain.MensajeReserva) []byte {
	t.Helper()
	b, err := json.Marshal(m)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestAtender_ExitosoDejaElCicloCompletoEnLosLogs(t *testing.T) {
	e := nuevoEntorno(2)
	tel := &telWorker{}
	w, buf := nuevoWorkerCon(e, tel)

	msg := e.solicitar(t, "u1", "evt-1") // ticket PENDIENTE
	if err := w.Atender(context.Background(), cuerpo(t, msg)); err != nil {
		t.Fatalf("una petición válida debe hacer ACK: %v", err)
	}

	salida := buf.String()
	if !strings.Contains(salida, "worker atendiendo petición") {
		t.Errorf("falta el log de inicio del ciclo: %s", salida)
	}
	if !strings.Contains(salida, "worker respondió petición") {
		t.Errorf("falta el log de ACK: %s", salida)
	}
	if !strings.Contains(salida, `"resultado":"ack"`) {
		t.Errorf("el log de cierre debe marcar resultado ack: %s", salida)
	}
	tel.mu.Lock()
	defer tel.mu.Unlock()
	if tel.recibidos != 1 {
		t.Errorf("telemetría debe reportar 1 recibido, dio %d", tel.recibidos)
	}
	if len(tel.procesados) != 1 || tel.procesados[0] != "procesado" {
		t.Errorf("se esperaba un procesado, llegó %v", tel.procesados)
	}
	if len(tel.reservas) != 1 || tel.reservas[0] != string(domain.EstadoConfirmada) {
		t.Errorf("la reserva debe contarse como %s, llegó %v", domain.EstadoConfirmada, tel.reservas)
	}
}

func TestAtender_JSONInvalidoSeDescartaYVaALaDLQ(t *testing.T) {
	e := nuevoEntorno(1)
	tel := &telWorker{}
	w, buf := nuevoWorkerCon(e, tel)

	if err := w.Atender(context.Background(), []byte("{no-json")); err == nil {
		t.Fatal("JSON inválido debe devolver error para que el consumidor haga NACK")
	}
	salida := buf.String()
	if !strings.Contains(salida, "worker descartó petición") {
		t.Errorf("falta el log de descarte: %s", salida)
	}
	if !strings.Contains(salida, "json inválido") {
		t.Errorf("el descarte debe decir el motivo: %s", salida)
	}
	tel.mu.Lock()
	defer tel.mu.Unlock()
	if len(tel.procesados) != 1 || tel.procesados[0] != "invalido" {
		t.Errorf("se esperaba status invalido, llegó %v", tel.procesados)
	}
	if len(tel.reservas) != 0 {
		t.Errorf("un mensaje inválido no cuenta reservas: %v", tel.reservas)
	}
}

func TestAtender_TicketInexistenteFallaSinConfirmar(t *testing.T) {
	e := nuevoEntorno(1)
	tel := &telWorker{}
	w, buf := nuevoWorkerCon(e, tel)

	msg := domain.MensajeReserva{TicketID: "NOPE", UsuarioID: "u1", EventoID: "evt-1"}
	if err := w.Atender(context.Background(), cuerpo(t, msg)); err == nil {
		t.Fatal("ticket inexistente debe fallar (NACK a la DLQ)")
	}
	salida := buf.String()
	if !strings.Contains(salida, "worker falló la petición") {
		t.Errorf("falta el log de fallo: %s", salida)
	}
	if !strings.Contains(salida, `"resultado":"nack-dlq"`) {
		t.Errorf("el fallo debe marcar nack-dlq: %s", salida)
	}
	tel.mu.Lock()
	defer tel.mu.Unlock()
	if len(tel.procesados) != 1 || tel.procesados[0] != "error" {
		t.Errorf("se esperaba status error, llegó %v", tel.procesados)
	}
	if len(tel.reservas) != 0 {
		t.Errorf("un error no cuenta como reserva resuelta: %v", tel.reservas)
	}
}

func TestAtender_SinCupoRespondeRechazadaPeroConACK(t *testing.T) {
	e := nuevoEntorno(1)
	tel := &telWorker{}
	w, buf := nuevoWorkerCon(e, tel)

	// Gasta el único cupo con u1.
	if err := w.Atender(context.Background(), cuerpo(t, e.solicitar(t, "u1", "evt-1"))); err != nil {
		t.Fatalf("la primera debe confirmarse: %v", err)
	}
	// u2 llega sin cupo: negocio resuelto (RECHAZADA) => ACK, no DLQ.
	if err := w.Atender(context.Background(), cuerpo(t, e.solicitar(t, "u2", "evt-1"))); err != nil {
		t.Fatalf("rechazo por cupo es un resultado válido y hace ACK: %v", err)
	}
	if !strings.Contains(buf.String(), `"estado":"RECHAZADA"`) {
		t.Errorf("el log debe mostrar la reserva rechazada: %s", buf.String())
	}
	tel.mu.Lock()
	defer tel.mu.Unlock()
	if len(tel.reservas) != 2 || tel.reservas[1] != string(domain.EstadoRechazada) {
		t.Errorf("se esperaba [CONFIRMADA RECHAZADA], llegó %v", tel.reservas)
	}
}

func TestNuevo_SinTelemetriaNoRevienta(t *testing.T) {
	e := nuevoEntorno(1)
	var buf bytes.Buffer
	w := worker.Nuevo(7, e.proc, slog.New(slog.NewJSONHandler(&buf, nil)), nil)
	if w.ID != 7 {
		t.Errorf("ID=7, dio %d", w.ID)
	}
	if err := w.Atender(context.Background(), cuerpo(t, e.solicitar(t, "u1", "evt-1"))); err != nil {
		t.Errorf("con telemetría nil el worker debe seguir operando: %v", err)
	}
	if !strings.Contains(buf.String(), "worker respondió petición") {
		t.Errorf("debe dejar su log igual: %s", buf.String())
	}
}

func TestPrefetch_EsBackPressureSobreLaCola(t *testing.T) {
	if worker.Prefetch <= 0 || worker.Prefetch > 100 {
		t.Errorf("prefetch razonable para una cola local, dio %d", worker.Prefetch)
	}
}
