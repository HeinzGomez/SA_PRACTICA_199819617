// HeinzGomez - Práctica 7: caso de uso "Reservar cupo" (CDU 3.1) en su lado PRODUCTOR.
// La petición HTTP/gRPC nunca bloquea esperando el cupo: se registra un ticket PENDIENTE
// y se publica el mensaje en la cola "reservas.solicitudes" de RabbitMQ.
package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/academix/reservas-service/internal/domain"
)

// TicketRepository persiste los tickets (Postgres en producción, memoria en pruebas).
type TicketRepository interface {
	Crear(ctx context.Context, t domain.Ticket) error
	Actualizar(ctx context.Context, t domain.Ticket) error
	Obtener(ctx context.Context, id string) (domain.Ticket, error)
	ListarPorUsuario(ctx context.Context, usuarioID string) ([]domain.Ticket, error)
}

// Publisher publica un mensaje en el exchange de eventos.
type Publisher interface {
	Publicar(ctx context.Context, routingKey string, msg domain.MensajeReserva) error
}

type Clock func() time.Time

type ReservasService struct {
	repo  TicketRepository
	pub   Publisher
	now   Clock
	newID func() string
}

func NewReservasService(repo TicketRepository, pub Publisher) *ReservasService {
	return &ReservasService{repo: repo, pub: pub, now: time.Now, newID: NuevoTicketID}
}

// WithClock permite fijar el reloj en pruebas.
func (s *ReservasService) WithClock(c Clock) *ReservasService { s.now = c; return s }

// WithIDGenerator permite fijar el generador de IDs en pruebas.
func (s *ReservasService) WithIDGenerator(g func() string) *ReservasService { s.newID = g; return s }

// SolicitarReserva registra el ticket PENDIENTE y lo encola. Devuelve inmediatamente.
func (s *ReservasService) SolicitarReserva(ctx context.Context, usuarioID, eventoID, tipo string) (domain.Ticket, error) {
	usuarioID = strings.TrimSpace(usuarioID)
	eventoID = strings.TrimSpace(eventoID)
	if usuarioID == "" || eventoID == "" {
		return domain.Ticket{}, domain.ErrDatosInvalidos
	}
	ahora := s.now().UTC()
	t := domain.Ticket{
		ID:            s.newID(),
		UsuarioID:     usuarioID,
		EventoID:      eventoID,
		Tipo:          domain.NormalizarTipo(tipo),
		Estado:        domain.EstadoPendiente,
		CupoRestante:  -1,
		CreadoEn:      ahora,
		ActualizadoEn: ahora,
	}
	if err := s.repo.Crear(ctx, t); err != nil {
		return domain.Ticket{}, fmt.Errorf("crear ticket: %w", err)
	}
	msg := domain.MensajeReserva{
		TicketID:  t.ID,
		UsuarioID: t.UsuarioID,
		EventoID:  t.EventoID,
		Tipo:      t.Tipo,
		Estado:    domain.EstadoPendiente,
		Timestamp: ahora.Format(time.RFC3339),
	}
	if err := s.pub.Publicar(ctx, domain.RKReservaSolicitada, msg); err != nil {
		// Compensación: si el broker no acepta el mensaje, el ticket se rechaza.
		t.Estado = domain.EstadoRechazada
		t.Motivo = domain.MotivoErrorInterno
		t.ActualizadoEn = s.now().UTC()
		_ = s.repo.Actualizar(ctx, t)
		return t, fmt.Errorf("%w: %v", domain.ErrBrokerNoDisponible, err)
	}
	return t, nil
}

func (s *ReservasService) ConsultarTicket(ctx context.Context, id string) (domain.Ticket, error) {
	if strings.TrimSpace(id) == "" {
		return domain.Ticket{}, domain.ErrTicketNoExiste
	}
	return s.repo.Obtener(ctx, id)
}

func (s *ReservasService) ListarReservasUsuario(ctx context.Context, usuarioID string) ([]domain.Ticket, error) {
	if strings.TrimSpace(usuarioID) == "" {
		return nil, domain.ErrDatosInvalidos
	}
	return s.repo.ListarPorUsuario(ctx, usuarioID)
}

// NuevoTicketID genera un identificador legible tipo "TKT-3F9A1C0B2D4E".
func NuevoTicketID() string {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("TKT-%d", time.Now().UnixNano())
	}
	return "TKT-" + strings.ToUpper(hex.EncodeToString(b))
}
