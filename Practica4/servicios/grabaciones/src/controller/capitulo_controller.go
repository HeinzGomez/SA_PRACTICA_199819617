// HeinzGomez - Controlador gRPC de capítulos: mapea mensajes protobuf a la capa de servicio
package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type CapituloController struct {
	capituloService services.CapituloService
}

func NewCapituloController(capituloService services.CapituloService) *CapituloController {
	return &CapituloController{capituloService: capituloService}
}

func (c *CapituloController) CrearCapitulo(ctx context.Context, req *pb.CrearCapituloRequest) (*pb.CrearCapituloResponse, error) {
	capitulo, err := c.capituloService.CrearCapitulo(types.CrearCapituloParams{
		IDClase:      req.GetIdClase(),
		Titulo:       req.GetTitulo(),
		TiempoInicio: req.GetTiempoInicio(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearCapituloResponse{
		Exito:    true,
		Mensaje:  "Capítulo creado exitosamente",
		Capitulo: mapCapitulo(capitulo),
	}, nil
}

func (c *CapituloController) EditarCapitulo(ctx context.Context, req *pb.EditarCapituloRequest) (*pb.EditarCapituloResponse, error) {
	capitulo, err := c.capituloService.EditarCapitulo(types.EditarCapituloParams{
		ID:           req.GetIdCapitulo(),
		Titulo:       req.GetTitulo(),
		TiempoInicio: req.GetTiempoInicio(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EditarCapituloResponse{
		Exito:    true,
		Mensaje:  "Capítulo actualizado exitosamente",
		Capitulo: mapCapitulo(capitulo),
	}, nil
}

func (c *CapituloController) EliminarCapitulo(ctx context.Context, req *pb.EliminarCapituloRequest) (*pb.EliminarCapituloResponse, error) {
	if err := c.capituloService.EliminarCapitulo(req.GetIdCapitulo()); err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarCapituloResponse{
		Exito:   true,
		Mensaje: "Capítulo eliminado exitosamente",
	}, nil
}

func (c *CapituloController) ConsultarCapitulosClase(ctx context.Context, req *pb.ConsultarCapitulosClaseRequest) (*pb.ConsultarCapitulosClaseResponse, error) {
	capitulos, err := c.capituloService.ConsultarCapitulosClase(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.Capitulo, 0, len(capitulos))
	for _, capitulo := range capitulos {
		registros = append(registros, mapCapitulo(capitulo))
	}

	return &pb.ConsultarCapitulosClaseResponse{
		Exito:     true,
		Mensaje:   "Capítulos consultados exitosamente",
		Capitulos: registros,
	}, nil
}

func mapCapitulo(capitulo types.Capitulo) *pb.Capitulo {
	return &pb.Capitulo{
		IdCapitulo:   capitulo.ID,
		IdClase:      capitulo.IDClase,
		Titulo:       capitulo.Titulo,
		TiempoInicio: capitulo.TiempoInicio,
	}
}
