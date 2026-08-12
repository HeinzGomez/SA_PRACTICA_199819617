package grpcserver

import (
	"fmt"
	"log"
	"net"

	"google.golang.org/grpc"

	"yousac/content-service/internal/grpc/handlers"
	pb "yousac/content-service/internal/pb"
)

// Start levanta el servidor gRPC del microservicio en el puerto dado.
// Este es el UNICO canal de comunicacion east-west habilitado para
// content-service (esta prohibido exponer REST entre microservicios).
func Start(port string, server *handlers.ContentServer) error {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		return err
	}

	grpcSrv := grpc.NewServer()
	pb.RegisterContentServiceServer(grpcSrv, server)

	log.Printf("[content-service] gRPC server listening on :%s", port)
	return grpcSrv.Serve(lis)
}
