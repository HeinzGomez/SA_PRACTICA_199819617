// HeinzGomez - Práctica 7: topología RabbitMQ del bus de eventos SOA (con reconexión automática).
//
//	exchange  academix.events (topic, durable)
//	  reserva.solicitada  -> queue reservas.solicitudes        (consumidor: este servicio)
//	  reserva.confirmada  -> queue talleres.cupos              (consumidor: Talleres)
//	  reserva.confirmada  -> queue certificados.inscripciones  (consumidor: Certificados)
//	exchange  academix.dlx (fanout) -> queue reservas.solicitudes.dlq
//
// HeinzGomez - si RabbitMQ se reinicia o la conexión TCP se cae (p. ej. la PC entra en suspensión),
// la conexión se restablece sola y los consumidores vuelven a suscribirse sin reiniciar el servicio.
package broker

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	ExchangeEventos   = "academix.events"
	ExchangeDLX       = "academix.dlx"
	QueueSolicitudes  = "reservas.solicitudes"
	QueueSolicitudDLQ = "reservas.solicitudes.dlq"
)

// EsperaReconexion es el tiempo entre intentos de reconexión.
var EsperaReconexion = 3 * time.Second

var ErrSinConexion = errors.New("sin conexión con RabbitMQ")

type Rabbit struct {
	url     string
	mu      sync.Mutex // protege conn/ch y serializa publicaciones concurrentes (gRPC + workers)
	conn    *amqp.Connection
	ch      *amqp.Channel
	cerrado bool
}

// Conectar abre la conexión inicial, declara la topología y deja un vigilante que reconecta.
func Conectar(url string) (*Rabbit, error) {
	r := &Rabbit{url: url}
	if err := r.conectar(); err != nil {
		return nil, err
	}
	go r.vigilar()
	return r, nil
}

func (r *Rabbit) conectar() error {
	conn, err := amqp.Dial(r.url)
	if err != nil {
		return err
	}
	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return err
	}
	if err := declarar(ch); err != nil {
		conn.Close()
		return err
	}
	r.mu.Lock()
	r.conn, r.ch = conn, ch
	r.mu.Unlock()
	return nil
}

// vigilar espera el cierre de la conexión y reconecta en bucle hasta lograrlo.
func (r *Rabbit) vigilar() {
	for {
		r.mu.Lock()
		conn, cerrado := r.conn, r.cerrado
		r.mu.Unlock()
		if cerrado || conn == nil {
			return
		}
		motivo := <-conn.NotifyClose(make(chan *amqp.Error, 1))
		r.mu.Lock()
		cerrado = r.cerrado
		r.mu.Unlock()
		if cerrado {
			return
		}
		log.Printf("[rabbitmq] conexión perdida (%v); reconectando…", motivo)
		for {
			time.Sleep(EsperaReconexion)
			if err := r.conectar(); err != nil {
				log.Printf("[rabbitmq] reconexión fallida: %v", err)
				continue
			}
			log.Printf("[rabbitmq] reconectado")
			break
		}
	}
}

func declarar(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(ExchangeEventos, "topic", true, false, false, false, nil); err != nil {
		return err
	}
	if err := ch.ExchangeDeclare(ExchangeDLX, "fanout", true, false, false, false, nil); err != nil {
		return err
	}
	if _, err := ch.QueueDeclare(QueueSolicitudDLQ, true, false, false, false, nil); err != nil {
		return err
	}
	if err := ch.QueueBind(QueueSolicitudDLQ, "", ExchangeDLX, false, nil); err != nil {
		return err
	}
	args := amqp.Table{"x-dead-letter-exchange": ExchangeDLX}
	if _, err := ch.QueueDeclare(QueueSolicitudes, true, false, false, false, args); err != nil {
		return err
	}
	return ch.QueueBind(QueueSolicitudes, domain.RKReservaSolicitada, ExchangeEventos, false, nil)
}

// Publicar implementa service.Publisher (mensajes persistentes, JSON).
// Si la conexión está caída devuelve error: el servicio compensa el ticket y el gateway responde 503.
func (r *Rabbit) Publicar(ctx context.Context, routingKey string, msg domain.MensajeReserva) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.ch == nil || r.ch.IsClosed() {
		return ErrSinConexion
	}
	return r.ch.PublishWithContext(ctx, ExchangeEventos, routingKey, false, false, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		MessageId:    msg.TicketID,
		Body:         body,
	})
}

// Consumir entrega los mensajes de la cola de solicitudes al handler con prefetch controlado.
// Si el canal se cierra, se vuelve a suscribir cuando la conexión se restablece. Solo termina con ctx.
func (r *Rabbit) Consumir(ctx context.Context, prefetch int, handler func(context.Context, []byte) error) error {
	for {
		if ctx.Err() != nil {
			return nil
		}
		deliveries, ch, err := r.suscribir(prefetch)
		if err != nil {
			select {
			case <-ctx.Done():
				return nil
			case <-time.After(EsperaReconexion):
				continue
			}
		}
		if terminado := procesar(ctx, deliveries, handler); terminado {
			ch.Close()
			return nil
		}
		log.Printf("[rabbitmq] canal de consumo cerrado; re-suscribiendo…")
	}
}

func (r *Rabbit) suscribir(prefetch int) (<-chan amqp.Delivery, *amqp.Channel, error) {
	r.mu.Lock()
	conn := r.conn
	r.mu.Unlock()
	if conn == nil || conn.IsClosed() {
		return nil, nil, ErrSinConexion
	}
	ch, err := conn.Channel()
	if err != nil {
		return nil, nil, err
	}
	if err := ch.Qos(prefetch, 0, false); err != nil {
		ch.Close()
		return nil, nil, err
	}
	deliveries, err := ch.Consume(QueueSolicitudes, "", false, false, false, false, nil)
	if err != nil {
		ch.Close()
		return nil, nil, err
	}
	return deliveries, ch, nil
}

// procesar devuelve true si terminó por cancelación del contexto y false si el canal se cerró.
func procesar(ctx context.Context, deliveries <-chan amqp.Delivery, handler func(context.Context, []byte) error) bool {
	for {
		select {
		case <-ctx.Done():
			return true
		case d, ok := <-deliveries:
			if !ok {
				return false
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
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cerrado = true
	if r.ch != nil {
		r.ch.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
