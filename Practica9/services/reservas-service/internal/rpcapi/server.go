// HeinzGomez - Práctica 9: adaptador de entrada del Servicio de Reservas.
// Reemplaza al antiguo servidor gRPC (internal/grpcapi, puerto 50053): cada operación
// llega como una petición JSON por la cola RPC y la respuesta vuelve en el mismo formato
// JSON que producía el contrato proto (snake_case, estado como texto, fechas RFC3339),
// así el API Gateway y el frontend no cambian.
package rpcapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
)

// Handler atiende una operación y devuelve el envoltorio completo de la respuesta.
// Los errores de negocio se responden como {ok:false, error:{codigo,mensaje}} dentro
// del cuerpo; solo se devuelve error cuando la respuesta no pudo construirse
// (operación desconocida, JSON malformado, fallo interno) y entonces el mensaje
// termina en la DLQ en vez de perderse.
type Handler func(ctx context.Context, cuerpo json.RawMessage) ([]byte, error)

// Server es el controlador de entrada del servicio: traduce contratos a casos de uso.
type Server struct {
	svc *service.ReservasService
}

func NewServer(svc *service.ReservasService) *Server { return &Server{svc: svc} }

// Manejadores devuelve routing key -> handler de cada operación que expone el servicio.
func (s *Server) Manejadores() map[string]Handler {
	return map[string]Handler{
		domain.RKSolicitarReserva:      envolver(domain.RKSolicitarReserva, s.solicitar),
		domain.RKConsultarTicket:       envolver(domain.RKConsultarTicket, s.consultar),
		domain.RKListarReservasUsuario: envolver(domain.RKListarReservasUsuario, s.listar),
	}
}

// Despachador adapta los manejadores al contrato del consumidor RPC del broker.
func (s *Server) Despachador() broker.DespacharRPC {
	manejadores := s.Manejadores()
	return func(ctx context.Context, sol broker.SolicitudRPC) ([]byte, error) {
		manejador, ok := manejadores[sol.Operacion]
		if !ok {
			return nil, fmt.Errorf("operación no soportada: %s", sol.Operacion)
		}
		return manejador(ctx, sol.Cuerpo)
	}
}

type solicitudReserva struct {
	UsuarioID string `json:"usuario_id"`
	EventoID  string `json:"evento_id"`
	Tipo      string `json:"tipo"`
}

type solicitudID struct {
	ID string `json:"id"`
}

func (s *Server) solicitar(ctx context.Context, cuerpo json.RawMessage) (TicketJSON, error) {
	var req solicitudReserva
	if err := json.Unmarshal(cuerpo, &req); err != nil {
		return TicketJSON{}, domain.ErrDatosInvalidos
	}
	t, err := s.svc.SolicitarReserva(ctx, req.UsuarioID, req.EventoID, req.Tipo)
	if err != nil {
		return TicketJSON{}, err
	}
	return aJSON(t), nil
}

func (s *Server) consultar(ctx context.Context, cuerpo json.RawMessage) (TicketJSON, error) {
	var req solicitudID
	if err := json.Unmarshal(cuerpo, &req); err != nil {
		return TicketJSON{}, domain.ErrDatosInvalidos
	}
	t, err := s.svc.ConsultarTicket(ctx, req.ID)
	if err != nil {
		return TicketJSON{}, err
	}
	return aJSON(t), nil
}

func (s *Server) listar(ctx context.Context, cuerpo json.RawMessage) (ListarTicketsJSON, error) {
	var req solicitudID
	if err := json.Unmarshal(cuerpo, &req); err != nil {
		return ListarTicketsJSON{}, domain.ErrDatosInvalidos
	}
	ts, err := s.svc.ListarReservasUsuario(ctx, req.ID)
	if err != nil {
		return ListarTicketsJSON{}, err
	}
	out := ListarTicketsJSON{Tickets: make([]TicketJSON, 0, len(ts))}
	for _, t := range ts {
		out.Tickets = append(out.Tickets, aJSON(t))
	}
	return out, nil
}

// TicketJSON replica el campo Ticket del contrato proto (campos snake_case, fechas RFC3339).
type TicketJSON struct {
	ID            string `json:"id"`
	UsuarioID     string `json:"usuario_id"`
	EventoID      string `json:"evento_id"`
	Estado        string `json:"estado"`
	Motivo        string `json:"motivo"`
	Tipo          string `json:"tipo"`
	CreadoEn      string `json:"creado_en"`
	ActualizadoEn string `json:"actualizado_en"`
	CupoRestante  int32  `json:"cupo_restante"`
}

// ListarTicketsJSON replica el mensaje ListaTickets del contrato proto.
type ListarTicketsJSON struct {
	Tickets []TicketJSON `json:"tickets"`
}

func aJSON(t domain.Ticket) TicketJSON {
	return TicketJSON{
		ID:            t.ID,
		UsuarioID:     t.UsuarioID,
		EventoID:      t.EventoID,
		Estado:        string(t.Estado),
		Motivo:        t.Motivo,
		Tipo:          t.Tipo,
		CreadoEn:      t.CreadoEn.Format(time.RFC3339),
		ActualizadoEn: t.ActualizadoEn.Format(time.RFC3339),
		CupoRestante:  t.CupoRestante,
	}
}

type respuestaOK struct {
	OK    bool `json:"ok"`
	Datos any  `json:"datos"`
}

type respuestaFalla struct {
	OK    bool        `json:"ok"`
	Error cuerpoError `json:"error"`
}

type cuerpoError struct {
	Codigo  string `json:"codigo"`
	Mensaje string `json:"mensaje"`
}

// envolver envuelve una operación de caso de uso en el contrato JSON compartido
// con el API Gateway: {ok:true,datos} o {ok:false,error:{codigo,mensaje}}.
func envolver[T any](operacion string, fn func(context.Context, json.RawMessage) (T, error)) Handler {
	return func(ctx context.Context, cuerpo json.RawMessage) ([]byte, error) {
		datos, err := fn(ctx, cuerpo)
		if err != nil {
			codigo := codigoDe(err)
			if codigo == "INTERNAL" {
				log.Printf("[rpcapi] %s falló: %v", operacion, err)
			}
			return json.Marshal(respuestaFalla{OK: false, Error: cuerpoError{
				Codigo:  codigo,
				Mensaje: mensajeDe(err, codigo),
			}})
		}
		return json.Marshal(respuestaOK{OK: true, Datos: datos})
	}
}

// codigoDe traduce los errores del dominio a los códigos que el API Gateway
// convierte en códigos HTTP (INVALID_ARGUMENT 400, NOT_FOUND 404, UNAVAILABLE 503).
func codigoDe(err error) string {
	switch {
	case errors.Is(err, domain.ErrDatosInvalidos):
		return "INVALID_ARGUMENT"
	case errors.Is(err, domain.ErrTicketNoExiste):
		return "NOT_FOUND"
	case errors.Is(err, domain.ErrBrokerNoDisponible):
		return "UNAVAILABLE"
	default:
		return "INTERNAL"
	}
}

func mensajeDe(err error, codigo string) string {
	if codigo == "INTERNAL" {
		return "Error interno"
	}
	return err.Error()
}
