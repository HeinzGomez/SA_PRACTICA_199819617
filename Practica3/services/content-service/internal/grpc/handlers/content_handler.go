package handlers

import (
	pb "yousac/content-service/internal/pb"
	"yousac/content-service/internal/repository"
)

// ContentServer implementa la interfaz completa pb.ContentServiceServer
// (catalogo, busqueda, ingesta, reproduccion, checkpoints, historial).
// Se registra UNA sola vez en el servidor gRPC (ver internal/grpc/server.go).
type ContentServer struct {
	pb.UnimplementedContentServiceServer
	Catalog  *repository.CatalogRepository
	Playback *repository.PlaybackRepository
}

func NewContentServer(catalog *repository.CatalogRepository, playback *repository.PlaybackRepository) *ContentServer {
	return &ContentServer{Catalog: catalog, Playback: playback}
}
