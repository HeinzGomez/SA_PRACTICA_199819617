// HeinzGomez - Práctica 7: pruebas unitarias del productor de reservas
package service_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
)

type fakePublisher struct {
	mensajes []domain.MensajeReserva
	keys     []string
	err      error
}

func (f *fakePublisher) Publicar(_ context.Context, rk string, m domain.MensajeReserva) error {
	if f.err != nil {
		return f.err
	}
	f.keys = append(f.keys, rk)
	f.mensajes = append(f.mensajes, m)
	return nil
}

var fijo = time.Date(2026, 9, 20, 10, 0, 0, 0, time.UTC)

func nuevoSvc(pub *fakePublisher) (*service.ReservasService, *store.MemoryTicketRepo) {
	repo := store.NewMemoryTicketRepo()
	svc := service.NewReservasService(repo, pub).
		WithClock(func() time.Time { return fijo }).
		WithIDGenerator(func() string { return "TKT-TEST00000001" })
	return svc, repo
}

func TestSolicitarReserva_CreaTicketPendienteYPublica(t *testing.T) {
	pub := &fakePublisher{}
	svc, repo := nuevoSvc(pub)

	tk, err := svc.SolicitarReserva(context.Background(), "u1", "evt-1", "")
	if err != nil {
		t.Fatalf("error inesperado: %v", err)
	}
	if tk.Estado != domain.EstadoPendiente {
		t.Errorf("estado = %s, se esperaba PENDIENTE", tk.Estado)
	}
	if tk.Tipo != domain.TipoAcreditacion {
		t.Errorf("tipo por defecto = %s, se esperaba ACREDITACION", tk.Tipo)
	}
	if len(pub.mensajes) != 1 || pub.keys[0] != domain.RKReservaSolicitada {
		t.Fatalf("se esperaba 1 mensaje reserva.solicitada, hubo %v", pub.keys)
	}
	if pub.mensajes[0].TicketID != tk.ID || pub.mensajes[0].EventoID != "evt-1" {
		t.Errorf("payload incorrecto: %+v", pub.mensajes[0])
	}
	guardado, _ := repo.Obtener(context.Background(), tk.ID)
	if guardado.Estado != domain.EstadoPendiente {
		t.Errorf("el ticket persistido debe estar PENDIENTE")
	}
}

func TestSolicitarReserva_DatosInvalidos(t *testing.T) {
	svc, _ := nuevoSvc(&fakePublisher{})
	casos := [][2]string{{"", "evt"}, {"u1", ""}, {"  ", "  "}}
	for _, c := range casos {
		if _, err := svc.SolicitarReserva(context.Background(), c[0], c[1], ""); !errors.Is(err, domain.ErrDatosInvalidos) {
			t.Errorf("(%q,%q): se esperaba ErrDatosInvalidos, se obtuvo %v", c[0], c[1], err)
		}
	}
}

func TestSolicitarReserva_BrokerCaidoCompensa(t *testing.T) {
	pub := &fakePublisher{err: errors.New("conexión rechazada")}
	svc, repo := nuevoSvc(pub)

	tk, err := svc.SolicitarReserva(context.Background(), "u1", "evt-1", domain.TipoExamenCertificacion)
	if !errors.Is(err, domain.ErrBrokerNoDisponible) {
		t.Fatalf("se esperaba ErrBrokerNoDisponible, se obtuvo %v", err)
	}
	guardado, _ := repo.Obtener(context.Background(), tk.ID)
	if guardado.Estado != domain.EstadoRechazada || guardado.Motivo != domain.MotivoErrorInterno {
		t.Errorf("el ticket debió compensarse a RECHAZADA/ERROR_INTERNO, quedó %s/%s", guardado.Estado, guardado.Motivo)
	}
}

func TestConsultarYListar(t *testing.T) {
	svc, _ := nuevoSvc(&fakePublisher{})
	tk, _ := svc.SolicitarReserva(context.Background(), "u9", "evt-2", "")

	got, err := svc.ConsultarTicket(context.Background(), tk.ID)
	if err != nil || got.ID != tk.ID {
		t.Fatalf("ConsultarTicket falló: %v", err)
	}
	if _, err := svc.ConsultarTicket(context.Background(), "NOPE"); !errors.Is(err, domain.ErrTicketNoExiste) {
		t.Errorf("se esperaba ErrTicketNoExiste")
	}
	if _, err := svc.ConsultarTicket(context.Background(), ""); !errors.Is(err, domain.ErrTicketNoExiste) {
		t.Errorf("id vacío debe ser ErrTicketNoExiste")
	}
	lista, err := svc.ListarReservasUsuario(context.Background(), "u9")
	if err != nil || len(lista) != 1 {
		t.Fatalf("se esperaba 1 reserva, hubo %d (%v)", len(lista), err)
	}
	if _, err := svc.ListarReservasUsuario(context.Background(), ""); !errors.Is(err, domain.ErrDatosInvalidos) {
		t.Errorf("usuario vacío debe fallar")
	}
}

func TestNuevoTicketID_Formato(t *testing.T) {
	id := service.NuevoTicketID()
	if !strings.HasPrefix(id, "TKT-") || len(id) != 16 {
		t.Errorf("formato inesperado: %s", id)
	}
	if id == service.NuevoTicketID() {
		t.Errorf("los IDs deben ser únicos")
	}
}
