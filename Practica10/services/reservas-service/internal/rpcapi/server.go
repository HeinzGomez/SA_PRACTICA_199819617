// HeinzGomez - Práctica 10: adaptador de entrada del Servicio de Reservas.
// Reemplaza al antiguo servidor gRPC (internal/grpcapi, puerto 50053): cada operación
// llega como una petición JSON por la cola RPC y la respuesta vuelve en el mismo formato
// JSON que producía el contrato proto (snake_case, estado como texto, fechas RFC3339),
// así el API Gateway y el frontend no cambian.
//
// Deja constancia de cada petición ("rpc atendiendo" / "rpc respondió") y registra
// su duración y resultado en la telemetría, sin acoplar este paquete a Prometheus (DIP).
package rpcapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/service"
)

// Telemetria registra las operaciones RPC atendidas. La implementa observabilidad.Metricas.
type Telemetria interface {
	RPC(operacion, status string, segundos float64)
}

// sinTelemetria evita comprobaciones nulas cuando no se quieren métricas.
type sinTelemetria struct{}

func (sinTelemetria) RPC(string, string, float64) {}

// Opcion configura el Server al construirlo (logger, telemetría).
type Opcion func(*Server)

// ConLogger inyecta el logger estructurado (por defecto se usa slog.Default).
func ConLogger(log *slog.Logger) Opcion {
	return func(s *Server) { s.log = log }
}

// ConTelemetria inyecta las métricas RPC (opcional).
func ConTelemetria(t Telemetria) Opcion {
	return func(s *Server) {
		if t != nil {
			s.tel = t
		}
	}
}

// Handler atiende una operación y devuelve el envoltorio completo de la respuesta.
// Los errores de negocio se responden como {ok:false, error:{codigo,mensaje}} dentro
// del cuerpo; solo se devuelve error cuando la respuesta no pudo construirse
// (operación desconocida, JSON malformado, fallo interno) y entonces el mensaje
// termina en la DLQ en vez de perderse.
type Handler func(ctx context.Context, cuerpo json.RawMessage) ([]byte, error)

// Server es el controlador de entrada del servicio: traduce contratos a casos de uso.
type Server struct {
	svc *service.ReservasService
	log *slog.Logger
	tel Telemetria
}

func NewServer(svc *service.ReservasService, opciones ...Opcion) *Server {
	s := &Server{svc: svc, log: slog.Default(), tel: sinTelemetria{}}
	for _, op := range opciones {
		op(s)
	}
	return s
}

// Manejadores devuelve routing key -> handler de cada operación que expone el servicio.
func (s *Server) Manejadores() map[string]Handler {
	return map[string]Handler{
		domain.RKSolicitarReserva:      envolver(s, domain.RKSolicitarReserva, s.solicitar),
		domain.RKConsultarTicket:       envolver(s, domain.RKConsultarTicket, s.consultar),
		domain.RKListarReservasUsuario: envolver(s, domain.RKListarReservasUsuario, s.listar),
	}
}

// Despachador adapta los manejadores al contrato del consumidor RPC del broker.
// Cada petición queda registrada con su duración y resultado (log + telemetría).
func (s *Server) Despachador() broker.DespacharRPC {
	manejadores := s.Manejadores()
	return func(ctx context.Context, sol broker.SolicitudRPC) ([]byte, error) {
		s.log.Info("rpc atendiendo petición",
			"operacion", sol.Operacion, "correlation_id", sol.CorrelationID)
		manejador, ok := manejadores[sol.Operacion]
		if !ok {
			s.tel.RPC(sol.Operacion, "error", 0)
			s.log.Warn("rpc operación no soportada",
				"operacion", sol.Operacion, "correlation_id", sol.CorrelationID)
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
// Deja el log de cierre ("rpc respondió") y alimenta la telemetría de la operación.
// (función libre porque un método no puede llevar parámetros de tipo en Go).
func envolver[T any](s *Server, operacion string, fn func(context.Context, json.RawMessage) (T, error)) Handler {
	return func(ctx context.Context, cuerpo json.RawMessage) ([]byte, error) {
		inicio := time.Now()
		datos, err := fn(ctx, cuerpo)
		segundos := time.Since(inicio).Seconds()
		if err != nil {
			codigo := codigoDe(err)
			if codigo == "INTERNAL" {
				s.log.Error("rpc respondió con error interno", "operacion", operacion, "error", err, "duracion_s", segundos)
			} else {
				s.log.Info("rpc respondió petición",
					"operacion", operacion, "resultado", "error", "codigo", codigo, "duracion_s", segundos)
			}
			s.tel.RPC(operacion, "error", segundos)
			return json.Marshal(respuestaFalla{OK: false, Error: cuerpoError{
				Codigo:  codigo,
				Mensaje: mensajeDe(err, codigo),
			}})
		}
		s.tel.RPC(operacion, "ok", segundos)
		s.log.Info("rpc respondió petición",
			"operacion", operacion, "resultado", "ok", "duracion_s", segundos)
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
