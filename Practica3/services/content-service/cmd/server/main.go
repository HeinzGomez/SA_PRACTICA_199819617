package main

import (
	"context"
	"log"

	"yousac/content-service/internal/config"
	"yousac/content-service/internal/db"
	grpcserver "yousac/content-service/internal/grpc"
	"yousac/content-service/internal/grpc/handlers"
	httpserver "yousac/content-service/internal/http"
	"yousac/content-service/internal/repository"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg)
	if err != nil {
		log.Fatalf("[content-service] error de conexion a PostgreSQL: %v", err)
	}
	defer pool.Close()
	log.Println("[content-service] Conectado a PostgreSQL (content_db).")

	catalogRepo := repository.NewCatalogRepository(pool)
	playbackRepo := repository.NewPlaybackRepository(pool)
	server := handlers.NewContentServer(catalogRepo, playbackRepo)

	// Healthcheck HTTP en goroutine separada (no es trafico de negocio)
	go func() {
		router := httpserver.NewHealthRouter()
		if err := router.Run(":" + cfg.HTTPPort); err != nil {
			log.Fatalf("[content-service] error en servidor HTTP de healthcheck: %v", err)
		}
	}()

	// Servidor gRPC principal (bloqueante)
	if err := grpcserver.Start(cfg.GRPCPort, server); err != nil {
		log.Fatalf("[content-service] error en servidor gRPC: %v", err)
	}
}
