// HeinzGomez - Práctica 7: topología RabbitMQ del bus de eventos SOA.
//
//	exchange  academix.events (topic, durable)
//	  reserva.solicitada  -> queue reservas.solicitudes        (consumidor: este servicio)
//	  reserva.confirmada  -> queue talleres.cupos              (consumidor: Talleres)
//	  reserva.confirmada  -> queue certificados.inscripciones  (consumidor: Certificados)
//	exchange  academix.dlx (fanout) -> queue reservas.solicitudes.dlq
package broker

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/academix/reservas-service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeEventos   = "academix.events"
	ExchangeDLX       = "academix.dlx"
	QueueSolicitudes  = "reservas.solicitudes"
	QueueSolicitudDLQ = "reservas.solicitudes.dlq"
)

type Rabbit struct {
	conn *amqp.Connection
	ch   *amqp.Channel
	mu   sync.Mutex // serializa publicaciones concurrentes (gRPC + workers) en el mismo canal
}

func Conectar(url string) (*Rabbit, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}
	r := &Rabbit{conn: conn, ch: ch}
	if err := r.declarar(); err != nil {
		r.Close()
		return nil, err
	}
	return r, nil
}

func (r *Rabbit) declarar() error {
	if err := r.ch.ExchangeDeclare(ExchangeEventos, "topic", true, false, false, false, nil); err != nil {
		return err
	}
	if err := r.ch.ExchangeDeclare(ExchangeDLX, "fanout", true, false, false, false, nil); err != nil {
		return err
	}
	if _, err := r.ch.QueueDeclare(QueueSolicitudDLQ, true, false, false, false, nil); err != nil {
		return err
	}
	if err := r.ch.QueueBind(QueueSolicitudDLQ, "", ExchangeDLX, false, nil); err != nil {
		return err
	}
	args := amqp.Table{"x-dead-letter-exchange": ExchangeDLX}
	if _, err := r.ch.QueueDeclare(QueueSolicitudes, true, false, false, false, args); err != nil {
		return err
	}
	return r.ch.QueueBind(QueueSolicitudes, domain.RKReservaSolicitada, ExchangeEventos, false, nil)
}

// Publicar implementa service.Publisher (mensajes persistentes, JSON).
func (r *Rabbit) Publicar(ctx context.Context, routingKey string, msg domain.MensajeReserva) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.ch.PublishWithContext(ctx, ExchangeEventos, routingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		MessageId:    msg.TicketID,
		Body:         body,
	})
}

// Consumir entrega los mensajes de la cola de solicitudes al handler con prefetch controlado.
func (r *Rabbit) Consumir(ctx context.Context, prefetch int, handler func(context.Context, []byte) error) error {
	ch, err := r.conn.Channel()
	if err != nil {
		return err
	}
	if err := ch.Qos(prefetch, 0, false); err != nil {
		return err
	}
	deliveries, err := ch.Consume(QueueSolicitudes, "reservas-worker", false, false, false, false, nil)
	if err != nil {
		return err
	}
	for {
		select {
		case <-ctx.Done():
			return ch.Close()
		case d, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("canal de consumo cerrado")
			}
			if err := handler(ctx, d.Body); err != nil {
				_ = d.Nack(false, false) // a la DLQ
				continue
			}
			_ = d.Ack(false)
		}
	}
}

func (r *Rabbit) Close() {
	if r.ch != nil {
		r.ch.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
