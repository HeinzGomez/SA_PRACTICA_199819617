// HeinzGomez - Práctica 7: pruebas unitarias del consumidor (validación de cupo y concurrencia)
package worker_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
	"github.com/academix/reservas-service/internal/worker"
)

type capturaPublisher struct {
	mu   sync.Mutex
	keys []string
	msgs []domain.MensajeReserva
	err  error
}

func (c *capturaPublisher) Publicar(_ context.Context, rk string, m domain.MensajeReserva) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err != nil {
		return c.err
	}
	c.keys = append(c.keys, rk)
	c.msgs = append(c.msgs, m)
	return nil
}

type entorno struct {
	repo  *store.MemoryTicketRepo
	cupos *store.MemoryCupoStore
	pub   *capturaPublisher
	svc   *service.ReservasService
	proc  *worker.Procesador
}

func nuevoEntorno(cupo int64) *entorno {
	e := &entorno{repo: store.NewMemoryTicketRepo(), cupos: store.NewMemoryCupoStore(), pub: &capturaPublisher{}}
	e.cupos.Inicializar("evt-1", cupo)
	e.svc = service.NewReservasService(e.repo, &capturaPublisher{})
	e.proc = worker.NewProcesador(e.repo, e.cupos, e.pub)
	return e
}

func (e *entorno) solicitar(t *testing.T, usuario, evento string) domain.MensajeReserva {
	t.Helper()
	tk, err := e.svc.SolicitarReserva(context.Background(), usuario, evento, "")
	if err != nil {
		t.Fatal(err)
	}
	return domain.MensajeReserva{TicketID: tk.ID, UsuarioID: usuario, EventoID: evento}
}

func TestProcesar_ConfirmaYDescuentaCupo(t *testing.T) {
	e := nuevoEntorno(2)
	tk, err := e.proc.Procesar(context.Background(), e.solicitar(t, "u1", "evt-1"))
	if err != nil {
		t.Fatal(err)
	}
	if tk.Estado != domain.EstadoConfirmada || tk.CupoRestante != 1 {
		t.Errorf("se esperaba CONFIRMADA con cupo 1, se obtuvo %s/%d", tk.Estado, tk.CupoRestante)
	}
	if e.pub.keys[0] != domain.RKReservaConfirmada {
		t.Errorf("debe publicar reserva.confirmada, publicó %v", e.pub.keys)
	}
	if e.cupos.Disponible("evt-1") != 1 {
		t.Errorf("cupo en store = %d", e.cupos.Disponible("evt-1"))
	}
}

func TestProcesar_RechazaSinCupo(t *testing.T) {
	e := nuevoEntorno(1)
	_, _ = e.proc.Procesar(context.Background(), e.solicitar(t, "u1", "evt-1"))
	tk, err := e.proc.Procesar(context.Background(), e.solicitar(t, "u2", "evt-1"))
	if err != nil {
		t.Fatal(err)
	}
	if tk.Estado != domain.EstadoRechazada || tk.Motivo != domain.MotivoSinCupo {
		t.Errorf("se esperaba RECHAZADA/SIN_CUPO, se obtuvo %s/%s", tk.Estado, tk.Motivo)
	}
	if e.pub.keys[1] != domain.RKReservaRechazada {
		t.Errorf("debe publicar reserva.rechazada")
	}
}

func TestProcesar_RechazaDuplicadaYEventoInexistente(t *testing.T) {
	e := nuevoEntorno(10)
	_, _ = e.proc.Procesar(context.Background(), e.solicitar(t, "u1", "evt-1"))
	dup, _ := e.proc.Procesar(context.Background(), e.solicitar(t, "u1", "evt-1"))
	if dup.Motivo != domain.MotivoDuplicada {
		t.Errorf("se esperaba RESERVA_DUPLICADA, se obtuvo %q", dup.Motivo)
	}
	inex, _ := e.proc.Procesar(context.Background(), e.solicitar(t, "u1", "evt-x"))
	if inex.Motivo != domain.MotivoEventoNoExiste {
		t.Errorf("se esperaba EVENTO_NO_EXISTE, se obtuvo %q", inex.Motivo)
	}
}

func TestProcesar_IdempotenteAnteReentrega(t *testing.T) {
	e := nuevoEntorno(5)
	msg := e.solicitar(t, "u1", "evt-1")
	_, _ = e.proc.Procesar(context.Background(), msg)
	tk, err := e.proc.Procesar(context.Background(), msg) // RabbitMQ re-entrega
	if err != nil {
		t.Fatal(err)
	}
	if tk.Estado != domain.EstadoConfirmada {
		t.Errorf("estado alterado por re-entrega: %s", tk.Estado)
	}
	if e.cupos.Disponible("evt-1") != 4 {
		t.Errorf("la re-entrega no debe descontar cupo otra vez; cupo=%d", e.cupos.Disponible("evt-1"))
	}
	if len(e.pub.keys) != 1 {
		t.Errorf("no debe re-publicar eventos; publicó %d", len(e.pub.keys))
	}
}

func TestProcesarJSON_MensajesInvalidos(t *testing.T) {
	e := nuevoEntorno(1)
	if _, err := e.proc.ProcesarJSON(context.Background(), []byte("{no-json")); err == nil {
		t.Error("JSON corrupto debe fallar (va a la DLQ)")
	}
	if _, err := e.proc.ProcesarJSON(context.Background(), []byte(`{"ticketId":""}`)); err == nil {
		t.Error("mensaje incompleto debe fallar")
	}
	if _, err := e.proc.ProcesarJSON(context.Background(), []byte(`{"ticketId":"NOPE","usuarioId":"u","eventoId":"e"}`)); !errors.Is(err, domain.ErrTicketNoExiste) {
		t.Errorf("ticket inexistente debe fallar con ErrTicketNoExiste: %v", err)
	}
}

func TestProcesar_ErrorAlPublicarResultado(t *testing.T) {
	e := nuevoEntorno(1)
	msg := e.solicitar(t, "u1", "evt-1")
	e.pub.err = errors.New("canal cerrado")
	tk, err := e.proc.Procesar(context.Background(), msg)
	if err == nil {
		t.Fatal("se esperaba error al publicar")
	}
	if tk.Estado != domain.EstadoConfirmada {
		t.Errorf("el ticket debe quedar confirmado aunque falle la notificación")
	}
}

// Simula la "ráfaga": 500 estudiantes compiten por 50 cupos con 16 consumidores concurrentes.
func TestProcesar_RafagaConcurrenteNoSobrevende(t *testing.T) {
	const cupo, estudiantes, consumidores = 50, 500, 16
	e := nuevoEntorno(cupo)
	cola := make(chan domain.MensajeReserva, estudiantes)
	for i := 0; i < estudiantes; i++ {
		cola <- e.solicitar(t, fmt.Sprintf("est-%03d", i), "evt-1")
	}
	close(cola)

	var confirmadas, rechazadas int64
	var wg sync.WaitGroup
	for c := 0; c < consumidores; c++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for m := range cola {
				tk, err := e.proc.Procesar(context.Background(), m)
				if err != nil {
					t.Error(err)
					return
				}
				if tk.Estado == domain.EstadoConfirmada {
					atomic.AddInt64(&confirmadas, 1)
				} else {
					atomic.AddInt64(&rechazadas, 1)
				}
			}
		}()
	}
	wg.Wait()
	if confirmadas != cupo || rechazadas != estudiantes-cupo {
		t.Errorf("confirmadas=%d rechazadas=%d; se esperaba %d/%d", confirmadas, rechazadas, cupo, estudiantes-cupo)
	}
	if e.cupos.Disponible("evt-1") != 0 {
		t.Errorf("cupo final = %d, se esperaba 0", e.cupos.Disponible("evt-1"))
	}
}

func TestMotivoDesdeResultado(t *testing.T) {
	casos := map[domain.ResultadoCupo]string{
		domain.CupoSinDisponibilidad: domain.MotivoSinCupo,
		domain.CupoDuplicado:         domain.MotivoDuplicada,
		domain.CupoEventoInexistente: domain.MotivoEventoNoExiste,
		5:                            "",
	}
	for in, want := range casos {
		if got := domain.MotivoDesdeResultado(in); got != want {
			t.Errorf("MotivoDesdeResultado(%d)=%q, se esperaba %q", in, got, want)
		}
	}
	if domain.NormalizarTipo("x") != domain.TipoAcreditacion || domain.NormalizarTipo(domain.TipoExamenCertificacion) != domain.TipoExamenCertificacion {
		t.Error("NormalizarTipo incorrecto")
	}
}
