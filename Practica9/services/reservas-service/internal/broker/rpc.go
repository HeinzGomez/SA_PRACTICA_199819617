// HeinzGomez - Práctica 9: cola RPC (request/reply) con la que el API Gateway llama a Reservas.
// Antes existía un servidor gRPC en el puerto 50053; ahora la petición viaja en una cola
// durable y la respuesta vuelve a la cola replyTo del gateway.
//
//	exchange  academix.rpc (direct, durable)
//	  reservas.solicitar      ─┐
//	  reservas.consultar_ticket ├─> queue reservas.rpc (durable) -> replyTo
//	  reservas.listar_usuario ─┘         │ ACK recién tras confirmarse la publicación
//	                                     └─ NACK sin reencolar -> reservas.rpc.dlq
//	exchange  academix.dlx.reservas (fanout) -> queue reservas.rpc.dlq
//
// El DLX es propio de este servicio para no cruzar los mensajes con la DLQ de
// reservas.solicitudes (que usa academix.dlx).
package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeRPC        = "academix.rpc"
	QueueRPC           = "reservas.rpc"
	QueueRPCDLQ        = "reservas.rpc.dlq"
	ExchangeRPCMuertos = "academix.dlx.reservas"
)

// TimeoutConfirmacion limita cuánto se espera la confirmación del broker al publicar
// para que una respuesta nunca se quede colgada sin ACK ni NACK.
const TimeoutConfirmacion = 10 * time.Second

// SolicitudRPC es una petición entrante del API Gateway.
type SolicitudRPC struct {
	Operacion     string
	Cuerpo        json.RawMessage
	ReplyTo       string
	CorrelationID string
}

// DespacharRPC atiende una petición y devuelve el JSON de la respuesta a publicar en ReplyTo.
// Los errores de negocio NO se devuelven como error: se responden como {ok:false, error:{...}}.
// Devolver error significa que la respuesta no pudo construirse (operación desconocida,
// fallo interno) y hace que el mensaje vaya a la DLQ en lugar de perderse en silencio.
type DespacharRPC func(context.Context, SolicitudRPC) ([]byte, error)

// declararRPC declara la cola del RPC con su DLQ y la bindea a las operaciones del servicio.
func declararRPC(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(ExchangeRPCMuertos, "fanout", true, false, false, false, nil); err != nil {
		return err
	}
	if _, err := ch.QueueDeclare(QueueRPCDLQ, true, false, false, false, nil); err != nil {
		return err
	}
	if err := ch.QueueBind(QueueRPCDLQ, "", ExchangeRPCMuertos, false, nil); err != nil {
		return err
	}
	args := amqp.Table{"x-dead-letter-exchange": ExchangeRPCMuertos, "x-dead-letter-routing-key": QueueRPCDLQ}
	if _, err := ch.QueueDeclare(QueueRPC, true, false, false, false, args); err != nil {
		return err
	}
	if err := ch.ExchangeDeclare(ExchangeRPC, "direct", true, false, false, false, nil); err != nil {
		return err
	}
	for _, rk := range domain.RoutingKeysRPC() {
		if err := ch.QueueBind(QueueRPC, rk, ExchangeRPC, false, nil); err != nil {
			return err
		}
	}
	return nil
}

// ConsumirRPC atiende las peticiones del API Gateway con prefetch controlado.
// El ACK se envía recién después de que el broker confirma que publicó la respuesta;
// si el handler o la publicación fallan, el mensaje se manda a la DLQ (no se pierde).
// Solo termina con ctx y se vuelve a suscribir cuando la conexión se restablece.
func (r *Rabbit) ConsumirRPC(ctx context.Context, prefetch int, despachar DespacharRPC) error {
	for {
		if ctx.Err() != nil {
			return nil
		}
		deliveries, ch, err := r.suscribir(QueueRPC, prefetch)
		if err != nil {
			select {
			case <-ctx.Done():
				return nil
			case <-time.After(EsperaReconexion):
				continue
			}
		}
		if terminado := procesarRPC(ctx, deliveries, func(ctx context.Context, d amqp.Delivery) error {
			return r.atenderRPC(ctx, d, despachar)
		}); terminado {
			ch.Close()
			return nil
		}
		log.Printf("[rabbitmq] canal del RPC cerrado; re-suscribiendo…")
	}
}

// atenderRPC parsea, despacha y responde; su resultado determina ACK (nil) o NACK -> DLQ.
func (r *Rabbit) atenderRPC(ctx context.Context, d amqp.Delivery, despachar DespacharRPC) error {
	sol := SolicitudRPC{
		Operacion:     d.RoutingKey,
		Cuerpo:        json.RawMessage(d.Body),
		ReplyTo:       d.ReplyTo,
		CorrelationID: d.CorrelationId,
	}
	if !json.Valid(d.Body) {
		return fmt.Errorf("JSON inválido en %s", d.RoutingKey)
	}
	respuesta, err := despachar(ctx, sol)
	if err != nil {
		return err
	}
	if sol.ReplyTo == "" {
		return fmt.Errorf("petición %s sin replyTo", d.RoutingKey)
	}
	if err := r.responder(ctx, sol.ReplyTo, sol.CorrelationID, respuesta); err != nil {
		return fmt.Errorf("publicar respuesta de %s: %w", d.RoutingKey, err)
	}
	return nil
}

// responder publica la respuesta en la cola replyTo y espera la confirmación del broker.
// Solo si esa confirmación llega, procesar() envía el ACK de la petición original.
func (r *Rabbit) responder(ctx context.Context, replyTo, correlationID string, cuerpo []byte) error {
	return r.publicarConfirmado(ctx, "", replyTo, amqp.Publishing{
		ContentType:   "application/json",
		CorrelationId: correlationID,
		ReplyTo:       replyTo,
		DeliveryMode:  amqp.Persistent,
		Body:          cuerpo,
	})
}
