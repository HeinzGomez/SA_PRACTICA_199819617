package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type AssignController struct {
	assignService services.AssignService
}

func NewAssignController(assignService services.AssignService) *AssignController {
	return &AssignController{assignService: assignService}
}

func (c *AssignController) AsignarDocente(ctx context.Context, req *pb.AsignarDocenteRequest) (*pb.AsignarDocenteResponse, error) {
	err := c.assignService.AsignarDocente(types.AsignarDocenteParams{
		IDClase:   req.GetIdClase(),
		IDUsuario: req.GetIdUsuario(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AsignarDocenteResponse{
		Exito:   true,
		Mensaje: "Docente asignado exitosamente",
	}, nil
}

func (c *AssignController) AsignarAuxiliar(ctx context.Context, req *pb.AsignarAuxiliarRequest) (*pb.AsignarAuxiliarResponse, error) {
	err := c.assignService.AsignarAuxiliar(types.AsignarAuxiliarParams{
		IDClase:   req.GetIdClase(),
		IDUsuario: req.GetIdUsuario(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AsignarAuxiliarResponse{
		Exito:   true,
		Mensaje: "Auxiliar asignado exitosamente",
	}, nil
}

func (c *AssignController) AsignarMaterialApoyo(ctx context.Context, req *pb.AsignarMaterialApoyoRequest) (*pb.AsignarMaterialApoyoResponse, error) {
	material, err := c.assignService.AsignarMaterialApoyo(types.AsignarMaterialApoyoParams{
		IDClase: req.GetIdClase(),
		Nombre:  req.GetNombre(),
		Tipo:    req.GetTipo(),
		URL:     req.GetUrl(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AsignarMaterialApoyoResponse{
		Exito:   true,
		Mensaje: "Material de apoyo agregado exitosamente",
		Material: &pb.MaterialApoyo{
			IdMaterial: material.ID,
			IdClase:    material.IDClase,
			Nombre:     material.Nombre,
			Tipo:       material.Tipo,
			Url:        material.URL,
		},
	}, nil
}

func (c *AssignController) AsignarTemaClaseGrabada(ctx context.Context, req *pb.AsignarTemaClaseGrabadaRequest) (*pb.AsignarTemaClaseGrabadaResponse, error) {
	err := c.assignService.AsignarTemaClaseGrabada(types.AsignarTemaClaseParams{
		IDClase: req.GetIdClase(),
		IDTema:  req.GetIdTema(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AsignarTemaClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Tema asignado a la clase exitosamente",
	}, nil
}

func (c *AssignController) DesasignarDocente(ctx context.Context, req *pb.DesasignarDocenteRequest) (*pb.DesasignarDocenteResponse, error) {
	err := c.assignService.DesasignarDocente(types.DesasignarDocenteParams{
		IDClase:   req.GetIdClase(),
		IDUsuario: req.GetIdUsuario(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.DesasignarDocenteResponse{
		Exito:   true,
		Mensaje: "Docente desasignado exitosamente",
	}, nil
}

func (c *AssignController) DesasignarAuxiliar(ctx context.Context, req *pb.DesasignarAuxiliarRequest) (*pb.DesasignarAuxiliarResponse, error) {
	err := c.assignService.DesasignarAuxiliar(types.DesasignarAuxiliarParams{
		IDClase:   req.GetIdClase(),
		IDUsuario: req.GetIdUsuario(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.DesasignarAuxiliarResponse{
		Exito:   true,
		Mensaje: "Auxiliar desasignado exitosamente",
	}, nil
}

func (c *AssignController) DesasignarMaterialApoyo(ctx context.Context, req *pb.DesasignarMaterialApoyoRequest) (*pb.DesasignarMaterialApoyoResponse, error) {
	err := c.assignService.DesasignarMaterialApoyo(types.DesasignarMaterialApoyoParams{
		IDMaterial: req.GetIdMaterial(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.DesasignarMaterialApoyoResponse{
		Exito:   true,
		Mensaje: "Material de apoyo desasignado exitosamente",
	}, nil
}

func (c *AssignController) DesasignarTemaClaseGrabada(ctx context.Context, req *pb.DesasignarTemaClaseGrabadaRequest) (*pb.DesasignarTemaClaseGrabadaResponse, error) {
	err := c.assignService.DesasignarTemaClaseGrabada(types.DesasignarTemaClaseParams{
		IDClase: req.GetIdClase(),
		IDTema:  req.GetIdTema(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.DesasignarTemaClaseGrabadaResponse{
		Exito:   true,
		Mensaje: "Tema desasignado de la clase exitosamente",
	}, nil
}

func (c *AssignController) ConsultarParticipantesClase(ctx context.Context, req *pb.ConsultarParticipantesClaseRequest) (*pb.ConsultarParticipantesClaseResponse, error) {
	participantes, err := c.assignService.ConsultarParticipantesClase(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}

	registros := make([]*pb.Participante, 0, len(participantes))
	for _, participante := range participantes {
		registros = append(registros, &pb.Participante{
			IdClase:          participante.IDClase,
			IdUsuario:        participante.IDUsuario,
			TipoParticipante: participante.TipoParticipante,
		})
	}

	return &pb.ConsultarParticipantesClaseResponse{
		Exito:         true,
		Mensaje:       "Participantes consultados exitosamente",
		Participantes: registros,
	}, nil
}
