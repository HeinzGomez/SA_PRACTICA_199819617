// HeinzGomez - Práctica 7: pruebas del adaptador gRPC (mapeo de estados y códigos de error)
package grpcapi_test

import (
	"context"
	"errors"
	"testing"

	pb "github.com/academix/reservas-service/gen/reservasv1"
	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/grpcapi"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type nopPub struct{ err error }

func (n nopPub) Publicar(context.Context, string, domain.MensajeReserva) error { return n.err }

func TestServer_FlujoCompleto(t *testing.T) {
	srv := grpcapi.NewServer(service.NewReservasService(store.NewMemoryTicketRepo(), nopPub{}))
	ctx := context.Background()

	tk, err := srv.SolicitarReserva(ctx, &pb.SolicitudReserva{UsuarioId: "u1", EventoId: "evt-1"})
	if err != nil {
		t.Fatal(err)
	}
	if tk.Estado != pb.EstadoTicket_PENDIENTE {
		t.Errorf("estado = %v", tk.Estado)
	}
	got, err := srv.ConsultarTicket(ctx, &pb.TicketId{Id: tk.Id})
	if err != nil || got.Id != tk.Id {
		t.Fatalf("ConsultarTicket: %v", err)
	}
	lista, err := srv.ListarReservasUsuario(ctx, &pb.UsuarioId{Id: "u1"})
	if err != nil || len(lista.Tickets) != 1 {
		t.Fatalf("Listar: %v", err)
	}
}

func TestServer_CodigosDeError(t *testing.T) {
	ctx := context.Background()
	srv := grpcapi.NewServer(service.NewReservasService(store.NewMemoryTicketRepo(), nopPub{}))
	_, err := srv.SolicitarReserva(ctx, &pb.SolicitudReserva{})
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("se esperaba InvalidArgument, se obtuvo %v", status.Code(err))
	}
	_, err = srv.ConsultarTicket(ctx, &pb.TicketId{Id: "NOPE"})
	if status.Code(err) != codes.NotFound {
		t.Errorf("se esperaba NotFound, se obtuvo %v", status.Code(err))
	}
	_, err = srv.ListarReservasUsuario(ctx, &pb.UsuarioId{})
	if status.Code(err) != codes.InvalidArgument {
		t.Errorf("se esperaba InvalidArgument")
	}

	caido := grpcapi.NewServer(service.NewReservasService(store.NewMemoryTicketRepo(), nopPub{err: errors.New("x")}))
	_, err = caido.SolicitarReserva(ctx, &pb.SolicitudReserva{UsuarioId: "u", EventoId: "e"})
	if status.Code(err) != codes.Unavailable {
		t.Errorf("broker caído debe mapear a Unavailable, se obtuvo %v", status.Code(err))
	}
	if status.Code(grpcapi.MapError(errors.New("otro"))) != codes.Internal {
		t.Errorf("error genérico debe ser Internal")
	}
}

func TestEstadoToProto(t *testing.T) {
	casos := map[domain.Estado]pb.EstadoTicket{
		domain.EstadoPendiente:  pb.EstadoTicket_PENDIENTE,
		domain.EstadoConfirmada: pb.EstadoTicket_CONFIRMADA,
		domain.EstadoRechazada:  pb.EstadoTicket_RECHAZADA,
		"OTRO":                  pb.EstadoTicket_ESTADO_TICKET_UNSPECIFIED,
	}
	for in, want := range casos {
		if got := grpcapi.EstadoToProto(in); got != want {
			t.Errorf("%s -> %v, se esperaba %v", in, got, want)
		}
	}
}
