package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"servicio-grabaciones/config"
	"servicio-grabaciones/controller"
	appgrpc "servicio-grabaciones/grpc"
	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/repositories"
	"servicio-grabaciones/services"
)

func main() {
	cfg, err := config.GetConfig()
	if err != nil {
		log.Fatalf("[main] error de configuración: %v", err)
	}

	db, err := config.GetDatabase()
	if err != nil {
		log.Fatalf("[main] no se pudo abrir la base de datos: %v", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatalf("[main] no se pudo conectar a la base de datos: %v", err)
	}
	defer config.CloseDatabase()

	topicRepo := repositories.NewPostgresTopicRepository(db)
	classRepo := repositories.NewPostgresClassRepository(db)
	assignRepo := repositories.NewPostgresAssignRepository(db)
	capituloRepo := repositories.NewPostgresCapituloRepository(db) // HeinzGomez - repositorio de capítulos
	logRepo := repositories.NewPostgresLogRepository(db)

	topicService := services.NewTopicService(topicRepo)
	classService := services.NewClassService(classRepo, assignRepo)
	assignService := services.NewAssignService(assignRepo, classRepo, topicRepo)
	capituloService := services.NewCapituloService(capituloRepo, classRepo) // HeinzGomez - servicio de capítulos
	logService := services.NewLogService(logRepo)

	topicController := controller.NewTopicController(topicService)
	classController := controller.NewClassController(classService)
	assignController := controller.NewAssignController(assignService)
	capituloController := controller.NewCapituloController(capituloService) // HeinzGomez - controlador de capítulos
	logController := controller.NewLogController(logService)

	grpcServer := grpc.NewServer()
	pb.RegisterGrabacionesServiceServer(
		grpcServer,
		// HeinzGomez - se agrega capituloController al servidor gRPC
		appgrpc.NewGrabacionesServer(topicController, classController, assignController, logController, capituloController),
	)
	reflection.Register(grpcServer)

	grpcAddr := fmt.Sprintf(":%d", cfg.Server.GRPCPort)
	lis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("[main] no se pudo abrir el puerto gRPC %s: %v", grpcAddr, err)
	}

	go func() {
		log.Printf("[main] servidor gRPC escuchando en %s", grpcAddr)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("[main] error del servidor gRPC: %v", err)
		}
	}()

	httpServer := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Server.HTTPPort),
		Handler: healthHandler(),
	}
	go func() {
		log.Printf("[main] servidor HTTP escuchando en %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[main] error del servidor HTTP: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[main] cerrando servidores...")
	grpcServer.GracefulStop()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("[main] error cerrando el servidor HTTP: %v", err)
	}
}

func healthHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	return mux
}
