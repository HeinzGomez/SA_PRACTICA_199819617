// HeinzGomez - Práctica 7: modelo de dominio del Servicio de Reservas/Ticketing
package domain

import (
	"errors"
	"time"
)

type Estado string

const (
	EstadoPendiente  Estado = "PENDIENTE"
	EstadoConfirmada Estado = "CONFIRMADA"
	EstadoRechazada  Estado = "RECHAZADA"
)

const (
	TipoAcreditacion        = "ACREDITACION"
	TipoExamenCertificacion = "EXAMEN_CERTIFICACION"
)

// Routing keys publicadas en el exchange topic "academix.events"
const (
	RKReservaSolicitada = "reserva.solicitada"
	RKReservaConfirmada = "reserva.confirmada"
	RKReservaRechazada  = "reserva.rechazada"
)

// Routing keys de entrada desde el API Gateway (exchange direct "academix.rpc";
// antes eran los métodos del contrato proto).
const (
	RKSolicitarReserva      = "reservas.solicitar"
	RKConsultarTicket       = "reservas.consultar_ticket"
	RKListarReservasUsuario = "reservas.listar_usuario"
)

// RoutingKeysRPC devuelve las operaciones que este servicio expone al API Gateway.
func RoutingKeysRPC() []string {
	return []string{RKSolicitarReserva, RKConsultarTicket, RKListarReservasUsuario}
}

// Motivos de rechazo
const (
	MotivoSinCupo        = "SIN_CUPO"
	MotivoDuplicada      = "RESERVA_DUPLICADA"
	MotivoEventoNoExiste = "EVENTO_NO_EXISTE"
	MotivoErrorInterno   = "ERROR_INTERNO"
)

var (
	ErrDatosInvalidos     = errors.New("usuario_id y evento_id son obligatorios")
	ErrTicketNoExiste     = errors.New("ticket no encontrado")
	ErrBrokerNoDisponible = errors.New("broker de mensajería no disponible")
)

type Ticket struct {
	ID            string
	UsuarioID     string
	EventoID      string
	Tipo          string
	Estado        Estado
	Motivo        string
	CupoRestante  int32
	CreadoEn      time.Time
	ActualizadoEn time.Time
}

// MensajeReserva es el payload JSON que viaja por RabbitMQ.
type MensajeReserva struct {
	TicketID     string `json:"ticketId"`
	UsuarioID    string `json:"usuarioId"`
	EventoID     string `json:"eventoId"`
	Tipo         string `json:"tipo"`
	Estado       Estado `json:"estado"`
	Motivo       string `json:"motivo,omitempty"`
	CupoRestante int32  `json:"cupoRestante"`
	Timestamp    string `json:"timestamp"`
}

// ResultadoCupo es la respuesta del script atómico de Redis.
type ResultadoCupo int64

const (
	CupoSinDisponibilidad ResultadoCupo = -1
	CupoDuplicado         ResultadoCupo = -2
	CupoEventoInexistente ResultadoCupo = -3
)

// MotivoDesdeResultado traduce el código del script Lua a un motivo de negocio.
func MotivoDesdeResultado(r ResultadoCupo) string {
	switch r {
	case CupoSinDisponibilidad:
		return MotivoSinCupo
	case CupoDuplicado:
		return MotivoDuplicada
	case CupoEventoInexistente:
		return MotivoEventoNoExiste
	default:
		return ""
	}
}

func NormalizarTipo(t string) string {
	if t == TipoExamenCertificacion {
		return t
	}
	return TipoAcreditacion
}
