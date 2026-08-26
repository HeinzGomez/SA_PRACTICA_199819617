package controller

import (
	"context"

	pb "servicio-historial/proto/historial"
	"servicio-historial/services"
	"servicio-historial/types"
)

type HistoryController struct {
	historyService services.HistoryService
}

func NewHistoryController(historyService services.HistoryService) *HistoryController {
	return &HistoryController{historyService: historyService}
}

func (c *HistoryController) RegistrarProgreso(ctx context.Context, req *pb.RegistrarProgresoRequest) (*pb.RegistrarProgresoResponse, error) {
	historial, err := c.historyService.RegistrarProgreso(types.RegistrarProgresoParams{
		IDUsuario:     req.GetIdUsuario(),
		IDClase:       req.GetIdClase(),
		IDTema:        req.GetIdTema(),
		MinutoActual:  req.GetMinutoActual(),
		SegundoActual: req.GetSegundoActual(),
		DuracionTotal: req.GetDuracionTotal(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.RegistrarProgresoResponse{
		Exito:     true,
		Mensaje:   "Progreso registrado exitosamente",
		Historial: mapHistorialReproduccion(historial),
	}, nil
}

func (c *HistoryController) ActualizarCheckpoint(ctx context.Context, req *pb.ActualizarCheckpointRequest) (*pb.ActualizarCheckpointResponse, error) {
	checkpoint, err := c.historyService.ActualizarCheckpoint(types.ActualizarCheckpointParams{
		IDUsuario:     req.GetIdUsuario(),
		IDClase:       req.GetIdClase(),
		IDTema:        req.GetIdTema(),
		MinutoActual:  req.GetMinutoActual(),
		SegundoActual: req.GetSegundoActual(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ActualizarCheckpointResponse{
		Exito:      true,
		Mensaje:    "Checkpoint actualizado exitosamente",
		Checkpoint: mapCheckpointClase(checkpoint),
	}, nil
}

func (c *HistoryController) MarcarClaseCompletada(ctx context.Context, req *pb.MarcarClaseCompletadaRequest) (*pb.MarcarClaseCompletadaResponse, error) {
	historial, err := c.historyService.MarcarClaseCompletada(req.GetIdUsuario(), req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.MarcarClaseCompletadaResponse{
		Exito:     true,
		Mensaje:   "Clase marcada como completada exitosamente",
		Historial: mapHistorialReproduccion(historial),
	}, nil
}

func (c *HistoryController) ObtenerCheckpointClase(ctx context.Context, req *pb.ObtenerCheckpointClaseRequest) (*pb.ObtenerCheckpointClaseResponse, error) {
	checkpoint, err := c.historyService.ObtenerCheckpointClase(req.GetIdUsuario(), req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ObtenerCheckpointClaseResponse{
		Exito:      true,
		Mensaje:    "Checkpoint consultado exitosamente",
		Checkpoint: mapCheckpointClase(checkpoint),
	}, nil
}

func (c *HistoryController) ConsultarHistorialUsuario(ctx context.Context, req *pb.ConsultarHistorialUsuarioRequest) (*pb.ConsultarHistorialUsuarioResponse, error) {
	result, err := c.historyService.ConsultarHistorialUsuario(types.ConsultarHistorialParams{
		IDUsuario: req.GetIdUsuario(),
		Pagina:    req.GetPagina(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.HistorialReproduccion, 0, len(result.Registros))
	for _, registro := range result.Registros {
		registros = append(registros, mapHistorialReproduccion(registro))
	}

	return &pb.ConsultarHistorialUsuarioResponse{
		Exito:        true,
		Mensaje:      "Historial consultado exitosamente",
		Registros:    registros,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *HistoryController) ConsultarEstadisticasUsuario(ctx context.Context, req *pb.ConsultarEstadisticasUsuarioRequest) (*pb.ConsultarEstadisticasUsuarioResponse, error) {
	estadisticas, err := c.historyService.ConsultarEstadisticasUsuario(req.GetIdUsuario())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ConsultarEstadisticasUsuarioResponse{
		Exito:        true,
		Mensaje:      "Estadísticas consultadas exitosamente",
		Estadisticas: mapEstadisticasUsuario(estadisticas),
	}, nil
}

func (c *HistoryController) EliminarHistorialClase(ctx context.Context, req *pb.EliminarHistorialClaseRequest) (*pb.EliminarHistorialClaseResponse, error) {
	err := c.historyService.EliminarHistorialClase(types.EliminarHistorialParams{
		IDUsuario: req.GetIdUsuario(),
		IDClase:   req.GetIdClase(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarHistorialClaseResponse{
		Exito:   true,
		Mensaje: "Historial de la clase eliminado exitosamente",
	}, nil
}

func mapHistorialReproduccion(historial types.HistorialReproduccion) *pb.HistorialReproduccion {
	return &pb.HistorialReproduccion{
		IdHistorial:             historial.IDHistorial,
		IdUsuario:               historial.IDUsuario,
		IdClase:                 historial.IDClase,
		IdTema:                  historial.IDTema,
		MinutoActual:            historial.MinutoActual,
		SegundoActual:           historial.SegundoActual,
		DuracionTotal:           historial.DuracionTotal,
		PorcentajeVisto:         float32(historial.PorcentajeVisto),
		FechaUltimaReproduccion: historial.FechaUltimaReproduccion,
		FechaCreacion:           historial.FechaCreacion,
		FechaActualizacion:      historial.FechaActualizacion,
		Completada:              historial.Completada,
	}
}

func mapCheckpointClase(checkpoint types.CheckpointClase) *pb.CheckpointClase {
	return &pb.CheckpointClase{
		IdTema:                  checkpoint.IDTema,
		MinutoActual:            checkpoint.MinutoActual,
		SegundoActual:           checkpoint.SegundoActual,
		PorcentajeVisto:         float32(checkpoint.PorcentajeVisto),
		Completada:              checkpoint.Completada,
		FechaUltimaReproduccion: checkpoint.FechaUltimaReproduccion,
	}
}

func mapEstadisticasUsuario(estadisticas types.EstadisticasUsuario) *pb.EstadisticasUsuario {
	return &pb.EstadisticasUsuario{
		TotalClases:        estadisticas.TotalClases,
		ClasesCompletadas:  estadisticas.ClasesCompletadas,
		PorcentajePromedio: float32(estadisticas.PorcentajePromedio),
		MinutosVistos:      estadisticas.MinutosVistos,
	}
}
