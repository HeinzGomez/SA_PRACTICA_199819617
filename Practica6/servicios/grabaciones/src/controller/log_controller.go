package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type LogController struct {
	logService services.LogService
}

func NewLogController(logService services.LogService) *LogController {
	return &LogController{logService: logService}
}

func (c *LogController) ConsultarAuditLogs(ctx context.Context, req *pb.ConsultarAuditLogsRequest) (*pb.ConsultarAuditLogsResponse, error) {
	result, err := c.logService.Consultar(types.ConsultarAuditLogsParams{
		Pagina:        req.GetPagina(),
		UsuarioFiltro: req.GetUsuarioFiltro(),
		TablaFiltro:   req.GetTablaFiltro(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.AuditLog, 0, len(result.Registros))
	for _, registro := range result.Registros {
		registros = append(registros, &pb.AuditLog{
			IdAuditoria:        registro.IDAuditoria,
			UsuarioResponsable: registro.UsuarioResponsable,
			Operacion:          registro.Operacion,
			TablaAfectada:      registro.TablaAfectada,
			FechaEvento:        registro.FechaEvento,
			EstadoAnterior:     strVal(registro.EstadoAnterior),
			EstadoNuevo:        strVal(registro.EstadoNuevo),
		})
	}

	return &pb.ConsultarAuditLogsResponse{
		Exito:        true,
		Mensaje:      "Auditoría consultada exitosamente",
		Registros:    registros,
		TotalPaginas: result.TotalPaginas,
	}, nil
}
