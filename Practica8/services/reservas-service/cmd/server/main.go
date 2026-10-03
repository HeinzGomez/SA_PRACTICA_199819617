// HeinzGomez - Práctica 7: punto de entrada del Servicio de Reservas/Ticketing (Go).
// Levanta el servidor gRPC (productor) y N workers consumidores de RabbitMQ.
package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	pb "github.com/academix/reservas-service/gen/reservasv1"
	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/grpcapi"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
	"github.com/academix/reservas-service/internal/worker"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

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

	repo := conReintentos("postgres", func() (*store.PostgresTicketRepo, error) {
		return store.NewPostgresTicketRepo(ctx, env("DATABASE_URL", "postgres://academix:academix@localhost:5432/reservas_db?sslmode=disable"))
	})
	defer repo.Close()

	rdb := redis.NewClient(&redis.Options{Addr: env("REDIS_ADDR", "localhost:6379")})
	conReintentos("redis", func() (string, error) { return rdb.Ping(ctx).Result() })

	rabbit := conReintentos("rabbitmq", func() (*broker.Rabbit, error) {
		return broker.Conectar(env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"))
	})
	defer rabbit.Close()

	svc := service.NewReservasService(repo, rabbit)
	proc := worker.NewProcesador(repo, store.NewRedisCupoStore(rdb), rabbit)

	workers, _ := strconv.Atoi(env("WORKERS", "4"))
	for i := 0; i < workers; i++ {
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

	lis, err := net.Listen("tcp", ":"+env("GRPC_PORT", "50053"))
	if err != nil {
		log.Fatal(err)
	}
	srv := grpc.NewServer()
	pb.RegisterReservasServiceServer(srv, grpcapi.NewServer(svc))
	hs := health.NewServer()
	healthpb.RegisterHealthServer(srv, hs)
	go func() {
		<-ctx.Done()
		srv.GracefulStop()
	}()
	log.Printf("reservas-service gRPC en %s con %d workers", lis.Addr(), workers)
	if err := srv.Serve(lis); err != nil {
		log.Fatal(err)
	}
}
