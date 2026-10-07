// HeinzGomez - Práctica 7: adaptador gRPC del Servicio de Reservas (contrato proto/reservas.proto)
package grpcapi

import (
	"context"
	"errors"
	"time"

	pb "github.com/academix/reservas-service/gen/reservasv1"
	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	pb.UnimplementedReservasServiceServer
	svc *service.ReservasService
}

func NewServer(svc *service.ReservasService) *Server { return &Server{svc: svc} }

func (s *Server) SolicitarReserva(ctx context.Context, req *pb.SolicitudReserva) (*pb.Ticket, error) {
	t, err := s.svc.SolicitarReserva(ctx, req.GetUsuarioId(), req.GetEventoId(), req.GetTipo())
	if err != nil {
		return nil, MapError(err)
	}
	return ToProto(t), nil
}

func (s *Server) ConsultarTicket(ctx context.Context, req *pb.TicketId) (*pb.Ticket, error) {
	t, err := s.svc.ConsultarTicket(ctx, req.GetId())
	if err != nil {
		return nil, MapError(err)
	}
	return ToProto(t), nil
}

func (s *Server) ListarReservasUsuario(ctx context.Context, req *pb.UsuarioId) (*pb.ListaTickets, error) {
	ts, err := s.svc.ListarReservasUsuario(ctx, req.GetId())
	if err != nil {
		return nil, MapError(err)
	}
	out := &pb.ListaTickets{Tickets: make([]*pb.Ticket, 0, len(ts))}
	for _, t := range ts {
		out.Tickets = append(out.Tickets, ToProto(t))
	}
	return out, nil
}

func MapError(err error) error {
	switch {
	case errors.Is(err, domain.ErrDatosInvalidos):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, domain.ErrTicketNoExiste):
		return status.Error(codes.NotFound, err.Error())
	case errors.Is(err, domain.ErrBrokerNoDisponible):
		return status.Error(codes.Unavailable, err.Error())
	default:
		return status.Error(codes.Internal, err.Error())
	}
}

func EstadoToProto(e domain.Estado) pb.EstadoTicket {
	switch e {
	case domain.EstadoPendiente:
		return pb.EstadoTicket_PENDIENTE
	case domain.EstadoConfirmada:
		return pb.EstadoTicket_CONFIRMADA
	case domain.EstadoRechazada:
		return pb.EstadoTicket_RECHAZADA
	default:
		return pb.EstadoTicket_ESTADO_TICKET_UNSPECIFIED
	}
}

func ToProto(t domain.Ticket) *pb.Ticket {
	return &pb.Ticket{
		Id:            t.ID,
		UsuarioId:     t.UsuarioID,
		EventoId:      t.EventoID,
		Estado:        EstadoToProto(t.Estado),
		Motivo:        t.Motivo,
		Tipo:          t.Tipo,
		CreadoEn:      t.CreadoEn.Format(time.RFC3339),
		ActualizadoEn: t.ActualizadoEn.Format(time.RFC3339),
		CupoRestante:  t.CupoRestante,
	}
}
