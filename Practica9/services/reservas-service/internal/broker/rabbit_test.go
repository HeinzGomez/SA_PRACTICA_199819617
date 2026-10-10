// HeinzGomez - Práctica 9: pruebas del broker que NO requieren un RabbitMQ vivo.
//
// Se cubren las piezas puras del ciclo de consumo (ACK/NACK, bucles de reintentos,
// despacho RPC y las salidas de error de las publicaciones). La declaración de colas
// y la conexión real necesitan un broker en marcha y quedan para la prueba de integración.
package broker

import (
	"context"
	"errors"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

func mensajePrueba() domain.MensajeReserva {
	return domain.MensajeReserva{
		TicketID: "TKT-1", UsuarioID: "u1", EventoID: "evt-1",
		Tipo: domain.TipoAcreditacion, Estado: domain.EstadoPendiente,
		Timestamp: "2026-10-05T15:00:00Z",
	}
}

// ackFalso registra lo que el consumidor le pide al canal AMQP. Los contadores
// se protegen con un mutex porque procesarRPC atiende varios mensajes a la vez y
// todas las goroutines comparten la misma instancia del mock.
type ackFalso struct {
	mu                    sync.Mutex
	acks, nacks, rechazos int
	requeue               bool
}

func (a *ackFalso) Ack(tag uint64, _ bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.acks++
	return nil
}
func (a *ackFalso) Nack(tag uint64, _ bool, requeue bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.nacks++
	a.requeue = requeue
	return nil
}
func (a *ackFalso) Reject(tag uint64, requeue bool) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.rechazos++
	a.requeue = requeue
	return nil
}

// totales lee los contadores de forma segura.
func (a *ackFalso) totales() (acks, nacks, rechazos int, requeue bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.acks, a.nacks, a.rechazos, a.requeue
}

func entrega(ack *ackFalso, rk, cuerpo string) amqp.Delivery {
	return amqp.Delivery{Acknowledger: ack, RoutingKey: rk, Body: []byte(cuerpo)}
}

func TestResolver_AckCuandoNoHayError(t *testing.T) {
	ack := &ackFalso{}
	resolver(context.Background(), entrega(ack, "rk", "{}"),
		func(context.Context, amqp.Delivery) error { return nil })
	acks, nacks, _, _ := ack.totales()
	if acks != 1 || nacks != 0 {
		t.Errorf("se esperaba un solo ACK, hubo acks=%d nacks=%d", acks, nacks)
	}
}

func TestResolver_NackSinReencolarVaALaDLQ(t *testing.T) {
	ack := &ackFalso{}
	resolver(context.Background(), entrega(ack, "rk", "{}"),
		func(context.Context, amqp.Delivery) error { return errors.New("boom") })
	acks, nacks, _, requeue := ack.totales()
	if nacks != 1 || acks != 0 {
		t.Errorf("un error debe producir NACK (no ACK): acks=%d nacks=%d", acks, nacks)
	}
	if requeue {
		t.Error("el NACK debe ser sin requeue para que el mensaje termine en la DLQ")
	}
}

func TestProcesar_DevuelveTrueAlCancelarElContexto(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	canal := make(chan amqp.Delivery, 1)
	canal <- entrega(&ackFalso{}, "rk", "{}")

	procesado := false
	salio := procesar(ctx, canal, func(context.Context, amqp.Delivery) error {
		procesado = true
		cancel()
		return nil
	})
	if !salio {
		t.Error("se esperaba true (terminó por cancelación del contexto)")
	}
	if !procesado {
		t.Error("el mensaje entregado no llegó al handler")
	}
}

func TestProcesar_DevuelveFalseCuandoSeCierraElCanal(t *testing.T) {
	canal := make(chan amqp.Delivery)
	close(canal)
	if procesar(context.Background(), canal, func(context.Context, amqp.Delivery) error { return nil }) {
		t.Error("se esperaba false: el canal se cerró, hay que re-suscribirse")
	}
}

func TestProcesarRPC_AtiendeEnParaleloYEsperaALasGoroutines(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	canal := make(chan amqp.Delivery, 3)
	acks := &ackFalso{}
	for i := 0; i < 3; i++ {
		canal <- entrega(acks, "rk", "{}")
	}

	var vistas atomic.Int64
	salio := procesarRPC(ctx, canal, func(context.Context, amqp.Delivery) error {
		time.Sleep(5 * time.Millisecond)
		vistas.Add(1)
		cancel()
		return nil
	})
	if !salio {
		t.Error("se esperaba true tras cancelar")
	}
	if vistas.Load() != 3 {
		t.Errorf("procesarRPC debe esperar a las respuestas pendientes: vistas=%d", vistas.Load())
	}
	confirmados, _, _, _ := acks.totales()
	if confirmados != 3 {
		t.Errorf("cada mensaje confirmado debe hacer ACK: %d", confirmados)
	}
}

func TestProcesarRPC_DevuelveFalseCuandoSeCierraElCanal(t *testing.T) {
	canal := make(chan amqp.Delivery)
	close(canal)
	if procesarRPC(context.Background(), canal, func(context.Context, amqp.Delivery) error { return nil }) {
		t.Error("se esperaba false al cerrarse el canal")
	}
}

func TestAtenderRPC_BodyNoValido(t *testing.T) {
	r := &Rabbit{}
	err := r.atenderRPC(context.Background(),
		entrega(&ackFalso{}, "reservas.solicitar", "{no-json"),
		func(context.Context, SolicitudRPC) ([]byte, error) { return []byte(`{}`), nil })
	if err == nil || !strings.Contains(err.Error(), "JSON inválido") {
		t.Errorf("se esperaba error de JSON, llegó %v", err)
	}
}

func TestAtenderRPC_ErrorDelDespachador(t *testing.T) {
	r := &Rabbit{}
	err := r.atenderRPC(context.Background(),
		entrega(&ackFalso{}, "reservas.consultar_ticket", `{"id":"x"}`),
		func(context.Context, SolicitudRPC) ([]byte, error) { return nil, errors.New("operación rota") })
	if err == nil || err.Error() != "operación rota" {
		t.Errorf("el error del handler debe subir para hacer NACK: %v", err)
	}
}

func TestAtenderRPC_SinReplyNoSePuedeResponder(t *testing.T) {
	r := &Rabbit{}
	d := entrega(&ackFalso{}, "reservas.solicitar", `{"usuario_id":"u","evento_id":"e"}`)
	d.ReplyTo = ""
	err := r.atenderRPC(context.Background(), d,
		func(context.Context, SolicitudRPC) ([]byte, error) { return []byte(`{"ok":true}`), nil })
	if err == nil || !strings.Contains(err.Error(), "sin replyTo") {
		t.Errorf("se esperaba 'sin replyTo', llegó %v", err)
	}
}

func TestAtenderRPC_SinConexionLaPublicacionFalla(t *testing.T) {
	r := &Rabbit{}
	d := entrega(&ackFalso{}, "reservas.solicitar", `{"usuario_id":"u","evento_id":"e"}`)
	d.ReplyTo = "gateway.reply"
	d.CorrelationId = "c-1"
	err := r.atenderRPC(context.Background(), d,
		func(context.Context, SolicitudRPC) ([]byte, error) { return []byte(`{"ok":true}`), nil })
	if !errors.Is(err, ErrSinConexion) {
		t.Errorf("se esperaba ErrSinConexion propagado, llegó %v", err)
	}
}

func TestPublicar_SinConexion(t *testing.T) {
	r := &Rabbit{}
	err := r.Publicar(context.Background(), "reserva.solicitada", mensajePrueba())
	if !errors.Is(err, ErrSinConexion) {
		t.Errorf("se esperaba ErrSinConexion, llegó %v", err)
	}
}

func TestPublicar_ConElBrokerCerrado(t *testing.T) {
	r := &Rabbit{cerrado: true}
	err := r.Publicar(context.Background(), "reserva.solicitada", mensajePrueba())
	if err == nil || err.Error() != "broker cerrado" {
		t.Errorf("se esperaba 'broker cerrado', llegó %v", err)
	}
}

func TestSuscribir_SinConexion(t *testing.T) {
	if _, _, err := (&Rabbit{}).suscribir(QueueSolicitudes, 10); !errors.Is(err, ErrSinConexion) {
		t.Errorf("se esperaba ErrSinConexion, llegó %v", err)
	}
}

func TestConsumir_TerminaConElContextoCancelado(t *testing.T) {
	conReconexionCorta(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := (&Rabbit{}).Consumir(ctx, 10, func(context.Context, []byte) error { return nil }); err != nil {
		t.Errorf("Consumir no debe devolver error al apagarse: %v", err)
	}
}

func TestConsumir_ReintentaHastaQueSeCancele(t *testing.T) {
	conReconexionCorta(t)
	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Millisecond)
	defer cancel()
	if err := (&Rabbit{}).Consumir(ctx, 10, func(context.Context, []byte) error { return nil }); err != nil {
		t.Errorf("Consumir no debe devolver error: %v", err)
	}
}

func TestConsumirRPC_ReintentaHastaQueSeCancele(t *testing.T) {
	conReconexionCorta(t)
	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Millisecond)
	defer cancel()
	r := &Rabbit{}
	despachar := func(context.Context, SolicitudRPC) ([]byte, error) { return nil, nil }
	if err := r.ConsumirRPC(ctx, 5, despachar); err != nil {
		t.Errorf("ConsumirRPC no debe devolver error: %v", err)
	}
}

func TestConsumirRPC_TerminaConElContextoCancelado(t *testing.T) {
	conReconexionCorta(t)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := (&Rabbit{}).ConsumirRPC(ctx, 5,
		func(context.Context, SolicitudRPC) ([]byte, error) { return nil, nil }); err != nil {
		t.Errorf("ConsumirRPC no debe devolver error: %v", err)
	}
}

func TestConectar_URLInalcanzable(t *testing.T) {
	conReconexionCorta(t)
	if _, err := Conectar("amqp://127.0.0.1:1/"); err == nil {
		t.Error("sin broker escuchando, Conectar debe fallar")
	}
}

func TestVigilar_SinConexionTerminaDeInmediato(t *testing.T) {
	fin := make(chan struct{})
	go func() {
		(&Rabbit{}).vigilar()
		close(fin)
	}()
	select {
	case <-fin:
	case <-time.After(200 * time.Millisecond):
		t.Error("vigilar debe salirse si no hay conexión que vigilar")
	}
}

func TestClose_EsIdempotenteYSinConexion(t *testing.T) {
	r := &Rabbit{}
	r.Close()
	r.Close()
	if !r.cerrado {
		t.Error("Close debe marcar el broker como cerrado")
	}
	if err := r.Publicar(context.Background(), "rk", mensajePrueba()); err == nil || err.Error() != "broker cerrado" {
		t.Errorf("tras Close no debe publicarse: %v", err)
	}
}

// conReconexionCorta acorta la espera de reconexión para que las pruebas no duren 3 s.
func conReconexionCorta(t *testing.T) {
	t.Helper()
	original := EsperaReconexion
	EsperaReconexion = 5 * time.Millisecond
	t.Cleanup(func() { EsperaReconexion = original })
}
