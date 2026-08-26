package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type TopicController struct {
	topicService services.TopicService
}

func NewTopicController(topicService services.TopicService) *TopicController {
	return &TopicController{topicService: topicService}
}

func (c *TopicController) CrearUnidad(ctx context.Context, req *pb.CrearUnidadRequest) (*pb.CrearUnidadResponse, error) {
	unidad, err := c.topicService.CrearUnidad(types.CrearUnidadParams{
		Nombre:      req.GetNombre(),
		Descripcion: strPtr(req.GetDescripcion()),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearUnidadResponse{
		Exito:   true,
		Mensaje: "Unidad creada exitosamente",
		Unidad:  mapUnidad(unidad),
	}, nil
}

func (c *TopicController) EditarUnidad(ctx context.Context, req *pb.EditarUnidadRequest) (*pb.EditarUnidadResponse, error) {
	unidad, err := c.topicService.EditarUnidad(types.EditarUnidadParams{
		ID:          req.GetIdUnidad(),
		Nombre:      req.GetNombre(),
		Descripcion: strPtr(req.GetDescripcion()),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EditarUnidadResponse{
		Exito:   true,
		Mensaje: "Unidad actualizada exitosamente",
		Unidad:  mapUnidad(unidad),
	}, nil
}

func (c *TopicController) EliminarUnidad(ctx context.Context, req *pb.EliminarUnidadRequest) (*pb.EliminarUnidadResponse, error) {
	err := c.topicService.EliminarUnidad(req.GetIdUnidad())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarUnidadResponse{
		Exito:   true,
		Mensaje: "Unidad eliminada exitosamente",
	}, nil
}

func (c *TopicController) ConsultarUnidades(ctx context.Context, req *pb.ConsultarUnidadesRequest) (*pb.ConsultarUnidadesResponse, error) {
	unidades, err := c.topicService.ConsultarUnidades()
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.Unidad, 0, len(unidades))
	for _, unidad := range unidades {
		registros = append(registros, mapUnidad(unidad))
	}

	return &pb.ConsultarUnidadesResponse{
		Exito:    true,
		Mensaje:  "Unidades consultadas exitosamente",
		Unidades: registros,
	}, nil
}

func (c *TopicController) CrearTema(ctx context.Context, req *pb.CrearTemaRequest) (*pb.CrearTemaResponse, error) {
	tema, err := c.topicService.CrearTema(types.CrearTemaParams{
		UnidadID:    req.GetIdUnidad(),
		Nombre:      req.GetNombre(),
		Descripcion: strPtr(req.GetDescripcion()),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearTemaResponse{
		Exito:   true,
		Mensaje: "Tema creado exitosamente",
		Tema:    mapTema(tema),
	}, nil
}

func (c *TopicController) ConsultarTemas(ctx context.Context, req *pb.ConsultarTemasRequest) (*pb.ConsultarTemasResponse, error) {
	temas, err := c.topicService.ConsultarTemas(req.GetIdUnidad())
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.Tema, 0, len(temas))
	for _, tema := range temas {
		registros = append(registros, mapTema(tema))
	}

	return &pb.ConsultarTemasResponse{
		Exito:   true,
		Mensaje: "Temas consultados exitosamente",
		Temas:   registros,
	}, nil
}

func (c *TopicController) EditarTema(ctx context.Context, req *pb.EditarTemaRequest) (*pb.EditarTemaResponse, error) {
	tema, err := c.topicService.EditarTema(types.EditarTemaParams{
		ID:          req.GetIdTema(),
		UnidadID:    req.GetIdUnidad(),
		Nombre:      req.GetNombre(),
		Descripcion: strPtr(req.GetDescripcion()),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EditarTemaResponse{
		Exito:   true,
		Mensaje: "Tema actualizado exitosamente",
		Tema:    mapTema(tema),
	}, nil
}

func (c *TopicController) EliminarTema(ctx context.Context, req *pb.EliminarTemaRequest) (*pb.EliminarTemaResponse, error) {
	err := c.topicService.EliminarTema(req.GetIdTema())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarTemaResponse{
		Exito:   true,
		Mensaje: "Tema eliminado exitosamente",
	}, nil
}

func mapUnidad(unidad types.Unidad) *pb.Unidad {
	return &pb.Unidad{
		IdUnidad:    unidad.ID,
		Nombre:      unidad.Nombre,
		Descripcion: strVal(unidad.Descripcion),
	}
}

func mapTema(tema types.Tema) *pb.Tema {
	return &pb.Tema{
		IdTema:      tema.ID,
		IdUnidad:    tema.UnidadID,
		Nombre:      tema.Nombre,
		Descripcion: strVal(tema.Descripcion),
		Unidad:      strVal(tema.Unidad),
	}
}
