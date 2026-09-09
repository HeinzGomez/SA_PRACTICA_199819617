package controller

import (
	"context"

	pb "servicio_recursos/proto/recursos"
	"servicio_recursos/services"
)

type NotesController struct {
	svc services.NotesService
}

func NewNotesController(svc services.NotesService) *NotesController {
	return &NotesController{svc: svc}
}

func (c *NotesController) ConsultarApunte(ctx context.Context, req *pb.ConsultarApunteRequest) (*pb.ConsultarApunteResponse, error) {
	apunte, err := c.svc.ConsultarApunte(req.GetIdClase(), req.GetIdUsuario())
	if err != nil {
		return nil, toGrpcError(err)
	}

	marcadores := make([]*pb.MarcadorTiempo, 0, len(apunte.Marcadores))
	for _, m := range apunte.Marcadores {
		marcadores = append(marcadores, &pb.MarcadorTiempo{
			IdMarcador: m.IDMarcador,
			Segundo:    m.Segundo,
			Texto:      m.Texto,
		})
	}

	return &pb.ConsultarApunteResponse{
		Exito:   true,
		Mensaje: "Apunte consultado exitosamente",
		Apunte: &pb.ApunteInfo{
			IdApunte:           apunte.IDApunte,
			IdClase:            apunte.IDClase,
			IdUsuario:          apunte.IDUsuario,
			Titulo:             apunte.Titulo,
			ContenidoMarkdown:  apunte.ContenidoMarkdown,
			FechaCreacion:      apunte.FechaCreacion,
			FechaActualizacion: apunte.FechaActualizacion,
			Marcadores:         marcadores,
		},
	}, nil
}

func (c *NotesController) CrearApunte(ctx context.Context, req *pb.CrearApunteRequest) (*pb.CrearApunteResponse, error) {
	id, err := c.svc.CrearApunte(req.GetIdClase(), req.GetIdUsuario(), req.GetTitulo(), req.GetContenidoMarkdown())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearApunteResponse{
		Exito:    true,
		Mensaje:  "Apunte creado exitosamente",
		IdApunte: id,
	}, nil
}

func (c *NotesController) ActualizarApunte(ctx context.Context, req *pb.ActualizarApunteRequest) (*pb.ActualizarApunteResponse, error) {
	err := c.svc.ActualizarApunte(req.GetIdApunte(), req.GetTitulo(), req.GetContenidoMarkdown())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ActualizarApunteResponse{
		Exito:   true,
		Mensaje: "Apunte actualizado exitosamente",
	}, nil
}

func (c *NotesController) AgregarMarcadorTiempo(ctx context.Context, req *pb.AgregarMarcadorTiempoRequest) (*pb.AgregarMarcadorTiempoResponse, error) {
	id, err := c.svc.AgregarMarcadorTiempo(req.GetIdApunte(), req.GetSegundo(), req.GetTexto())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AgregarMarcadorTiempoResponse{
		Exito:      true,
		Mensaje:    "Marcador agregado exitosamente",
		IdMarcador: id,
	}, nil
}

func (c *NotesController) EliminarMarcadorTiempo(ctx context.Context, req *pb.EliminarMarcadorTiempoRequest) (*pb.EliminarMarcadorTiempoResponse, error) {
	err := c.svc.EliminarMarcadorTiempo(req.GetIdMarcador())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarMarcadorTiempoResponse{
		Exito:   true,
		Mensaje: "Marcador eliminado exitosamente",
	}, nil
}
