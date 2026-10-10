// HeinzGomez - Práctica 9: punto de entrada del Servicio de Reservas/Ticketing (Go).
// Levanta N workers que consumen la cola de solicitudes y el consumidor RPC por el que
// el API Gateway le pide las reservas (antes era un servidor gRPC en el puerto 50053).
package main

import (
	"context"
	"log"
	"os/signal"
	"syscall"
	"time"

	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/config"
	"github.com/academix/reservas-service/internal/rpcapi"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
	"github.com/academix/reservas-service/internal/worker"
	"github.com/redis/go-redis/v9"
)

func conReintentos[T any](nombre string, f func() (T, error)) T {
	var zero T
	for i := 1; i <= 30; i++ {
		v, err := f()
		if err == nil {
			return v
		}
		log.Printf("[%s] intento %d fallido: %v", nombre, i, err)
		time.Sleep(2 * time.Second)
	}
	log.Fatalf("[%s] no disponible", nombre)
	return zero
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	cfg := config.LeerEntorno()

	repo := conReintentos("postgres", func() (*store.PostgresTicketRepo, error) {
		return store.NewPostgresTicketRepo(ctx, cfg.DatabaseURL)
	})
	defer repo.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	defer rdb.Close()
	conReintentos("redis", func() (string, error) { return rdb.Ping(ctx).Result() })

	rabbit := conReintentos("rabbitmq", func() (*broker.Rabbit, error) {
		return broker.Conectar(cfg.RabbitmqURL)
	})
	defer rabbit.Close()

	svc := service.NewReservasService(repo, rabbit)
	proc := worker.NewProcesador(repo, store.NewRedisCupoStore(rdb), rabbit)

	// Workers: consumen "reservas.solicitudes" y cierran el ciclo PENDIENTE -> CONFIRMADA/RECHAZADA.
	for i := 0; i < cfg.Workers; i++ {
		go func(n int) {
			err := rabbit.Consumir(ctx, 20, func(ctx context.Context, body []byte) error {
				t, err := proc.ProcesarJSON(ctx, body)
				if err != nil {
					log.Printf("[worker %d] error: %v", n, err)
					return err
				}
				log.Printf("[worker %d] ticket %s -> %s %s", n, t.ID, t.Estado, t.Motivo)
				return nil
			})
			if err != nil {
				log.Printf("[worker %d] detenido: %v", n, err)
			} else {
				log.Printf("[worker %d] detenido por apagado del servicio", n)
			}
		}(i)
	}

	// RPC: el API Gateway publica en academix.rpc y este consumidor responde en replyTo.
	api := rpcapi.NewServer(svc)
	go func() {
		if err := rabbit.ConsumirRPC(ctx, cfg.RPCPrefetch, api.Despachador()); err != nil {
			log.Printf("[rpc] detenido: %v", err)
		} else {
			log.Printf("[rpc] detenido por apagado del servicio")
		}
	}()

	log.Printf("reservas-service listo: cola %s + %d workers", broker.QueueRPC, cfg.Workers)
	<-ctx.Done()
	log.Println("reservas-service deteniendo…")
}
