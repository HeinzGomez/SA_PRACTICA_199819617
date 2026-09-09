package grpc

import (
	"context"

	"servicio-historial/controller"
	pb "servicio-historial/proto/historial"
)

type HistorialServer struct {
	pb.UnimplementedHistorialServiceServer
	history *controller.HistoryController
	log     *controller.LogController
}

func NewHistorialServer(
	history *controller.HistoryController,
	log *controller.LogController,
) *HistorialServer {
	return &HistorialServer{
		history: history,
		log:     log,
	}
}

func (s *HistorialServer) RegistrarProgreso(ctx context.Context, req *pb.RegistrarProgresoRequest) (*pb.RegistrarProgresoResponse, error) {
	return s.history.RegistrarProgreso(ctx, req)
}

func (s *HistorialServer) ActualizarCheckpoint(ctx context.Context, req *pb.ActualizarCheckpointRequest) (*pb.ActualizarCheckpointResponse, error) {
	return s.history.ActualizarCheckpoint(ctx, req)
}

func (s *HistorialServer) MarcarClaseCompletada(ctx context.Context, req *pb.MarcarClaseCompletadaRequest) (*pb.MarcarClaseCompletadaResponse, error) {
	return s.history.MarcarClaseCompletada(ctx, req)
}

func (s *HistorialServer) ObtenerCheckpointClase(ctx context.Context, req *pb.ObtenerCheckpointClaseRequest) (*pb.ObtenerCheckpointClaseResponse, error) {
	return s.history.ObtenerCheckpointClase(ctx, req)
}

func (s *HistorialServer) ConsultarHistorialUsuario(ctx context.Context, req *pb.ConsultarHistorialUsuarioRequest) (*pb.ConsultarHistorialUsuarioResponse, error) {
	return s.history.ConsultarHistorialUsuario(ctx, req)
}

func (s *HistorialServer) ConsultarEstadisticasUsuario(ctx context.Context, req *pb.ConsultarEstadisticasUsuarioRequest) (*pb.ConsultarEstadisticasUsuarioResponse, error) {
	return s.history.ConsultarEstadisticasUsuario(ctx, req)
}

func (s *HistorialServer) EliminarHistorialClase(ctx context.Context, req *pb.EliminarHistorialClaseRequest) (*pb.EliminarHistorialClaseResponse, error) {
	return s.history.EliminarHistorialClase(ctx, req)
}

func (s *HistorialServer) ConsultarAuditLogs(ctx context.Context, req *pb.ConsultarAuditLogsRequest) (*pb.ConsultarAuditLogsResponse, error) {
	return s.log.ConsultarAuditLogs(ctx, req)
}
