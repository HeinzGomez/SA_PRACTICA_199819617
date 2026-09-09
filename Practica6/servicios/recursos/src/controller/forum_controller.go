package controller

import (
	"context"

	pb "servicio_recursos/proto/recursos"
	"servicio_recursos/services"
)

type ForumController struct {
	svc services.ForumService
}

func NewForumController(svc services.ForumService) *ForumController {
	return &ForumController{svc: svc}
}

func (c *ForumController) ConsultarDudasClase(ctx context.Context, req *pb.ConsultarDudasClaseRequest) (*pb.ConsultarDudasClaseResponse, error) {
	dudas, totalPaginas, err := c.svc.ConsultarDudasClase(req.GetIdClase(), req.GetPagina())
	if err != nil {
		return nil, toGrpcError(err)
	}

	pbDudas := make([]*pb.Duda, 0, len(dudas))
	for _, d := range dudas {
		respuestas := make([]*pb.Respuesta, 0, len(d.Respuestas))
		for _, r := range d.Respuestas {
			respuestas = append(respuestas, &pb.Respuesta{
				IdRespuesta:   r.IDRespuesta,
				IdDuda:        r.IDDuda,
				IdUsuario:     r.IDUsuario,
				Respuesta:     r.Respuesta,
				Marcada:       r.Marcada,
				FechaCreacion: r.FechaCreacion,
			})
		}

		pbDudas = append(pbDudas, &pb.Duda{
			IdDudas:       d.IDDudas,
			IdClase:       d.IDClase,
			IdUsuario:     d.IDUsuario,
			Duda:          d.Duda,
			Segundo:       d.Segundo,
			FechaCreacion: d.FechaCreacion,
			Respuestas:    respuestas,
		})
	}

	return &pb.ConsultarDudasClaseResponse{
		Exito:       true,
		Mensaje:     "Dudas consultadas exitosamente",
		Dudas:       pbDudas,
		TotalPaginas: totalPaginas,
	}, nil
}

func (c *ForumController) CrearDuda(ctx context.Context, req *pb.CrearDudaRequest) (*pb.CrearDudaResponse, error) {
	id, err := c.svc.CrearDuda(req.GetIdClase(), req.GetIdUsuario(), req.GetDuda(), req.Segundo)
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearDudaResponse{
		Exito:   true,
		Mensaje: "Duda creada exitosamente",
		IdDudas: id,
	}, nil
}

func (c *ForumController) CrearRespuesta(ctx context.Context, req *pb.CrearRespuestaRequest) (*pb.CrearRespuestaResponse, error) {
	id, err := c.svc.CrearRespuesta(req.GetIdDuda(), req.GetIdUsuario(), req.GetRespuesta())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearRespuestaResponse{
		Exito:       true,
		Mensaje:     "Respuesta creada exitosamente",
		IdRespuesta: id,
	}, nil
}

func (c *ForumController) MarcarRespuesta(ctx context.Context, req *pb.MarcarRespuestaRequest) (*pb.MarcarRespuestaResponse, error) {
	err := c.svc.MarcarRespuesta(req.GetIdRespuesta(), req.GetIdUsuario())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.MarcarRespuestaResponse{
		Exito:   true,
		Mensaje: "Respuesta marcada exitosamente",
	}, nil
}
