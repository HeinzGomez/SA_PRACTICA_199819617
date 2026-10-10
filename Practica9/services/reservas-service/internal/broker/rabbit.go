// HeinzGomez - Práctica 7: topología RabbitMQ del bus de eventos SOA (con reconexión automática).
//
//	exchange  academix.events (topic, durable)
//	  reserva.solicitada  -> queue reservas.solicitudes        (consumidor: este servicio)
//	  reserva.confirmada  -> queue talleres.cupos              (consumidor: Talleres)
//	  reserva.confirmada  -> queue certificados.inscripciones  (consumidor: Certificados)
//	exchange  academix.dlx (fanout) -> queue reservas.solicitudes.dlq
//
// Además expone la cola RPC con la que el API Gateway lo llama (ver rpc.go) y todas las
// publicaciones usan canal con confirmaciones: si RabbitMQ no confirma, hay error y el
// llamador decide (p. ej. compensar el ticket y responder 503) en vez de perder el mensaje.
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
	url  string
	mu   sync.Mutex // protege conn/ch/confirmCh y serializa publicaciones concurrentes (RPC + workers)
	conn *amqp.Connection
	ch   *amqp.Channel
	// confirmCh es el canal con confirmaciones de entrega con el que se publica.
	confirmCh *amqp.Channel
	cerrado   bool
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
	r.confirmCh = nil // pertenece a la conexión anterior
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
	if err := ch.QueueBind(QueueSolicitudes, domain.RKReservaSolicitada, ExchangeEventos, false, nil); err != nil {
		return err
	}
	return declararRPC(ch)
}

// Publicar implementa service.Publisher (mensajes persistentes, JSON, con confirmación).
// Si el broker no confirma, devuelve error: el servicio compensa el ticket y el gateway responde 503.
func (r *Rabbit) Publicar(ctx context.Context, routingKey string, msg domain.MensajeReserva) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	return r.publicarConfirmado(ctx, ExchangeEventos, routingKey, amqp.Publishing{
		ContentType:  "application/json",
		DeliveryMode: amqp.Persistent,
		MessageId:    msg.TicketID,
		Body:         body,
	})
}

// publicarConfirmado publica y espera la confirmación del broker en un canal de confirmaciones.
// Llama con r.mu tomado. Una publicación sin confirmación no garantiza nada: por eso se
// devuelve error (y se descarta el canal para reconectarlo) en lugar de dar por hecho el éxito.
func (r *Rabbit) publicarConfirmado(ctx context.Context, exchange, routingKey string, msg amqp.Publishing) error {
	ctx, cancel := context.WithTimeout(ctx, TimeoutConfirmacion)
	defer cancel()

	r.mu.Lock()
	defer r.mu.Unlock()
	if r.cerrado {
		return errors.New("broker cerrado")
	}
	ch, err := r.canalConfirmacion()
	if err != nil {
		return err
	}
	conf, err := ch.PublishWithDeferredConfirmWithContext(ctx, exchange, routingKey, false, false, msg)
	if err != nil {
		r.descartarConfirmacion(ch)
		return err
	}
	if conf == nil {
		r.descartarConfirmacion(ch)
		return errors.New("el canal no tiene confirmaciones habilitadas")
	}
	ok, err := conf.WaitContext(ctx)
	if err != nil {
		r.descartarConfirmacion(ch)
		return err
	}
	if !ok {
		return errors.New("el broker rechazó el mensaje")
	}
	return nil
}

// canalConfirmacion devuelve (y crea si hace falta) el canal de confirmaciones. Llama con r.mu tomado.
func (r *Rabbit) canalConfirmacion() (*amqp.Channel, error) {
	if r.conn == nil || r.conn.IsClosed() {
		return nil, ErrSinConexion
	}
	if r.confirmCh != nil && !r.confirmCh.IsClosed() {
		return r.confirmCh, nil
	}
	ch, err := r.conn.Channel()
	if err != nil {
		return nil, err
	}
	if err := ch.Confirm(false); err != nil {
		ch.Close()
		return nil, err
	}
	r.confirmCh = ch
	return ch, nil
}

// descartarConfirmacion cierra un canal de confirmaciones roto para que el siguiente intento cree uno nuevo.
func (r *Rabbit) descartarConfirmacion(ch *amqp.Channel) {
	if r.confirmCh == ch {
		r.confirmCh = nil
	}
	ch.Close()
}

// Consumir entrega los mensajes de la cola de solicitudes al handler con prefetch controlado.
// Si el canal se cierra, se vuelve a suscribir cuando la conexión se restablece. Solo termina con ctx.
func (r *Rabbit) Consumir(ctx context.Context, prefetch int, handler func(context.Context, []byte) error) error {
	for {
		if ctx.Err() != nil {
			return nil
		}
		deliveries, ch, err := r.suscribir(QueueSolicitudes, prefetch)
		if err != nil {
			select {
			case <-ctx.Done():
				return nil
			case <-time.After(EsperaReconexion):
				continue
			}
		}
		if terminado := procesar(ctx, deliveries, func(ctx context.Context, d amqp.Delivery) error {
			return handler(ctx, d.Body)
		}); terminado {
			ch.Close()
			return nil
		}
		log.Printf("[rabbitmq] canal de consumo cerrado; re-suscribiendo…")
	}
}

func (r *Rabbit) suscribir(cola string, prefetch int) (<-chan amqp.Delivery, *amqp.Channel, error) {
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
	deliveries, err := ch.Consume(cola, "", false, false, false, false, nil)
	if err != nil {
		ch.Close()
		return nil, nil, err
	}
	return deliveries, ch, nil
}

// resolver resuelve un mensaje: sin error => ACK (la respuesta ya salió y el broker la
// confirmó), con error => NACK sin reencolar (a la DLQ de esa cola).
func resolver(ctx context.Context, d amqp.Delivery, handler func(context.Context, amqp.Delivery) error) {
	if err := handler(ctx, d); err != nil {
		log.Printf("[rabbitmq] mensaje %s rechazado: %v", d.RoutingKey, err)
		_ = d.Nack(false, false) // a la DLQ
		return
	}
	_ = d.Ack(false)
}

// procesar atiende los mensajes de a uno (los workers controlan su paralelismo con WORKERS).
// Devuelve true si terminó por cancelación del contexto y false si el canal se cerró.
func procesar(ctx context.Context, deliveries <-chan amqp.Delivery, handler func(context.Context, amqp.Delivery) error) bool {
	for {
		select {
		case <-ctx.Done():
			return true
		case d, ok := <-deliveries:
			if !ok {
				return false
			}
			resolver(ctx, d, handler)
		}
	}
}

// procesarRPC atiende los mensajes en paralelo (como hacía el servidor gRPC): el máximo
// en vuelo lo fija el prefetch del canal, así que no se lanzan goroutines sin control.
// Espera a que terminen las respuestas pendientes antes de devolver el control.
func procesarRPC(ctx context.Context, deliveries <-chan amqp.Delivery, handler func(context.Context, amqp.Delivery) error) bool {
	var pendientes sync.WaitGroup
	defer pendientes.Wait()
	for {
		select {
		case <-ctx.Done():
			return true
		case d, ok := <-deliveries:
			if !ok {
				return false
			}
			pendientes.Add(1)
			go func(d amqp.Delivery) {
				defer pendientes.Done()
				resolver(ctx, d, handler)
			}(d)
		}
	}
}

func (r *Rabbit) Close() {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.cerrado = true
	if r.confirmCh != nil {
		r.confirmCh.Close()
	}
	if r.ch != nil {
		r.ch.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
