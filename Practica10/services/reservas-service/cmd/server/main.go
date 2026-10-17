// HeinzGomez - Práctica 10: punto de entrada del Servicio de Reservas/Ticketing (Go).
//
// Composition root: aquí solo se ensambla. Levanta el logger JSON, las métricas,
// el servidor de sondas (/health, /health/ready, /metrics), N workers que consumen
// la cola de solicitudes y el consumidor RPC por el que el API Gateway consulta.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/config"
	"github.com/academix/reservas-service/internal/observabilidad"
	"github.com/academix/reservas-service/internal/rpcapi"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
	"github.com/academix/reservas-service/internal/worker"
	"github.com/redis/go-redis/v9"
)

// drenajeMaximo es lo que se espera a que los workers terminen sus mensajes en vuelo
// antes de cerrar el proceso (evita reentregas al reiniciar el pod).
const drenajeMaximo = 10 * time.Second

// healthcheck devuelve el código de salida del subcomando del contenedor:
// 0 si /health responde (proceso vivo), 1 si no (K8s/Docker reinicia el pod).
func healthcheck(cfg config.Entorno) int {
	if err := observabilidad.SondearSalud(cfg.Puerto); err != nil {
		fmt.Fprintln(os.Stderr, "liveness:", err)
		return 1
	}
	return 0
}

func conReintentos[T any](log *slog.Logger, nombre string, f func() (T, error)) T {
	var zero T
	for i := 1; i <= 30; i++ {
		v, err := f()
		if err == nil {
			return v
		}
		log.Warn("arranque: dependencia no disponible", "dependencia", nombre, "intento", i, "error", err)
		time.Sleep(2 * time.Second)
	}
	log.Error("arranque: dependencia agotó los reintentos", "dependencia", nombre)
	os.Exit(1)
	return zero
}

func main() {
	// El healthcheck del contenedor usa el propio binario (distroless no tiene curl ni shell).
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		os.Exit(healthcheck(config.LeerEntorno()))
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	cfg := config.LeerEntorno()
	log := observabilidad.NuevoLogger(observabilidad.NivelLeido(cfg.LogLevel), cfg.Version, nil)
	metricas := observabilidad.NuevoMetricas()

	repo := conReintentos(log, "postgres", func() (*store.PostgresTicketRepo, error) {
		return store.NewPostgresTicketRepo(ctx, cfg.DatabaseURL)
	})
	defer repo.Close()

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})
	defer rdb.Close()
	conReintentos(log, "redis", func() (string, error) { return rdb.Ping(ctx).Result() })

	rabbit := conReintentos(log, "rabbitmq", func() (*broker.Rabbit, error) {
		return broker.Conectar(cfg.RabbitmqURL, log)
	})
	defer rabbit.Close()
	rabbit.AlCambiarEstado(metricas.Broker)

	svc := service.NewReservasService(repo, rabbit)
	proc := worker.NewProcesador(repo, store.NewRedisCupoStore(rdb), rabbit)

	// Workers: N goroutines, cada una con su canal suscrito a "reservas.solicitudes".
	// No hay polling: el broker entrega por canal y worker.Atender corre el ciclo
	// recibir -> procesar -> ACK/NACK dejando constancia en los logs.
	var drenaje sync.WaitGroup
	for i := 0; i < cfg.Workers; i++ {
		w := worker.Nuevo(i, proc, log, metricas)
		drenaje.Add(1)
		go func(w *worker.Worker) {
			defer drenaje.Done()
			log.Info("worker iniciando consumo de la cola",
				"worker", w.ID, "cola", broker.QueueSolicitudes, "prefetch", worker.Prefetch)
			if err := rabbit.Consumir(ctx, worker.Prefetch, w.Atender); err != nil {
				log.Error("worker detenido con error", "worker", w.ID, "error", err)
				return
			}
			log.Info("worker detenido por apagado del servicio", "worker", w.ID)
		}(w)
	}

	// RPC: el API Gateway publica en academix.rpc y este consumidor responde en replyTo.
	api := rpcapi.NewServer(svc, rpcapi.ConLogger(log), rpcapi.ConTelemetria(metricas))
	go func() {
		if err := rabbit.ConsumirRPC(ctx, cfg.RPCPrefetch, api.Despachador()); err != nil {
			log.Error("consumidor RPC detenido", "error", err)
			return
		}
		log.Info("consumidor RPC detenido por apagado del servicio")
	}()

	// Sondas de orquestación: liveness siempre; readiness contra postgres, redis y broker.
	atencion := observabilidad.NuevoServidorAtencion(cfg.Puerto, metricas, observabilidad.Sondas{
		Postgres: repo.Ping,
		Redis:    func(ctx context.Context) error { return rdb.Ping(ctx).Err() },
		Broker: func() error {
			if rabbit.Conectado() {
				return nil
			}
			return errors.New("sin conexión con RabbitMQ")
		},
	}, cfg.Version)
	puerto, err := atencion.Iniciar()
	if err != nil {
		log.Error("no se pudo abrir el puerto de observabilidad", "puerto", cfg.Puerto, "error", err)
		os.Exit(1)
	}

	log.Info("reservas-service listo",
		"cola", broker.QueueSolicitudes, "workers", cfg.Workers, "puerto_observabilidad", puerto)
	<-ctx.Done()
	log.Info("reservas-service deteniendo; drenando mensajes en vuelo…", "maximo_s", drenajeMaximo.Seconds())

	// Drenaje ordenado: los mensajes en vuelo terminan (ACK) antes de cerrar.
	drenado := make(chan struct{})
	go func() { drenaje.Wait(); close(drenado) }()
	select {
	case <-drenado:
		log.Info("workers drenados")
	case <-time.After(drenajeMaximo):
		log.Warn("drenaje agotado; saliendo con mensajes sin confirmar (se reentregarán)")
	}

	apagado, cancelApagado := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelApagado()
	if err := atencion.Detener(apagado); err != nil {
		log.Warn("error al cerrar el servidor de observabilidad", "error", err)
	}
	log.Info("reservas-service detenido")
}
