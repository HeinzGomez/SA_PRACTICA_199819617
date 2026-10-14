// HeinzGomez - Práctica 7: CONSUMIDOR de la cola "reservas.solicitudes" (CDU 3.3 Validar Cupo).
// Cada mensaje se resuelve con una operación atómica en Redis (script Lua), por lo que
// miles de solicitudes concurrentes nunca sobre-venden el cupo.
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
)

// CupoStore reserva un lugar de forma atómica.
// Devuelve el cupo restante (>= 0) o un código negativo de domain.ResultadoCupo.
type CupoStore interface {
	Reservar(ctx context.Context, eventoID, usuarioID string) (domain.ResultadoCupo, error)
}

type Procesador struct {
	repo  service.TicketRepository
	cupos CupoStore
	pub   service.Publisher
	now   func() time.Time
}

func NewProcesador(repo service.TicketRepository, cupos CupoStore, pub service.Publisher) *Procesador {
	return &Procesador{repo: repo, cupos: cupos, pub: pub, now: time.Now}
}

// ProcesarJSON decodifica el cuerpo del mensaje AMQP y lo procesa.
// Un error devuelto indica que el mensaje debe ir a la DLQ (nack sin requeue).
func (p *Procesador) ProcesarJSON(ctx context.Context, body []byte) (domain.Ticket, error) {
	var msg domain.MensajeReserva
	if err := json.Unmarshal(body, &msg); err != nil {
		return domain.Ticket{}, fmt.Errorf("mensaje inválido: %w", err)
	}
	return p.Procesar(ctx, msg)
}

func (p *Procesador) Procesar(ctx context.Context, msg domain.MensajeReserva) (domain.Ticket, error) {
	if msg.TicketID == "" || msg.EventoID == "" || msg.UsuarioID == "" {
		return domain.Ticket{}, fmt.Errorf("mensaje incompleto: %+v", msg)
	}
	t, err := p.repo.Obtener(ctx, msg.TicketID)
	if err != nil {
		return domain.Ticket{}, err
	}
	// Idempotencia: si el broker re-entrega un mensaje ya resuelto, no se procesa de nuevo.
	if t.Estado != domain.EstadoPendiente {
		return t, nil
	}

	res, err := p.cupos.Reservar(ctx, msg.EventoID, msg.UsuarioID)
	if err != nil {
		return domain.Ticket{}, fmt.Errorf("redis: %w", err)
	}

	routing := domain.RKReservaConfirmada
	if res >= 0 {
		t.Estado = domain.EstadoConfirmada
		t.Motivo = ""
		t.CupoRestante = int32(res)
	} else {
		routing = domain.RKReservaRechazada
		t.Estado = domain.EstadoRechazada
		t.Motivo = domain.MotivoDesdeResultado(res)
		t.CupoRestante = 0
	}
	t.ActualizadoEn = p.now().UTC()
	if err := p.repo.Actualizar(ctx, t); err != nil {
		return domain.Ticket{}, err
	}

	evento := domain.MensajeReserva{
		TicketID:     t.ID,
		UsuarioID:    t.UsuarioID,
		EventoID:     t.EventoID,
		Tipo:         t.Tipo,
		Estado:       t.Estado,
		Motivo:       t.Motivo,
		CupoRestante: t.CupoRestante,
		Timestamp:    t.ActualizadoEn.Format(time.RFC3339),
	}
	// Notifica a Talleres (sincroniza cupo) y a Certificados (habilita examen).
	if err := p.pub.Publicar(ctx, routing, evento); err != nil {
		return t, fmt.Errorf("publicar %s: %w", routing, err)
	}
	return t, nil
}
