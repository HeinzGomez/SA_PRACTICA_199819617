package controller

import (
	"context"

	pb "servicio_recursos/proto/recursos"
	"servicio_recursos/services"
	"servicio_recursos/types"
)

type RepoController struct {
	svc services.RepoService
}

func NewRepoController(svc services.RepoService) *RepoController {
	return &RepoController{svc: svc}
}

func (c *RepoController) CrearRepositorio(ctx context.Context, req *pb.CrearRepositorioRequest) (*pb.CrearRepositorioResponse, error) {
	id, err := c.svc.CrearRepositorio(types.CrearRepositorioParams{
		IDClase: req.GetIdClase(),
		Nombre:  req.GetNombre(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.CrearRepositorioResponse{
		Exito:        true,
		Mensaje:      "Repositorio creado exitosamente",
		IdRepositorio: id,
	}, nil
}

func (c *RepoController) AgregarArchivo(ctx context.Context, req *pb.AgregarArchivoRequest) (*pb.AgregarArchivoResponse, error) {
	id, err := c.svc.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: req.GetIdRepositorio(),
		Nombre:        req.GetNombre(),
		Link:          req.GetLink(),
		Tag:           req.GetTag(),
		Hash:          req.GetHash(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.AgregarArchivoResponse{
		Exito:    true,
		Mensaje:  "Archivo agregado exitosamente",
		IdArchivo: id,
	}, nil
}

func (c *RepoController) ActualizarVersionArchivo(ctx context.Context, req *pb.ActualizarVersionArchivoRequest) (*pb.ActualizarVersionArchivoResponse, error) {
	err := c.svc.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{
		IDArchivo: req.GetIdArchivo(),
		Link:      req.GetLink(),
		Tag:       req.GetTag(),
		Hash:      req.GetHash(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ActualizarVersionArchivoResponse{
		Exito:   true,
		Mensaje: "Versión actualizada exitosamente",
	}, nil
}

func (c *RepoController) ActualizarTag(ctx context.Context, req *pb.ActualizarTagRequest) (*pb.ActualizarTagResponse, error) {
	err := c.svc.ActualizarTag(req.GetIdVersion(), req.GetTag())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.ActualizarTagResponse{
		Exito:   true,
		Mensaje: "Tag actualizado exitosamente",
	}, nil
}

func (c *RepoController) EliminarArchivo(ctx context.Context, req *pb.EliminarArchivoRequest) (*pb.EliminarArchivoResponse, error) {
	err := c.svc.EliminarArchivo(req.GetIdArchivo())
	if err != nil {
		return nil, toGrpcError(err)
	}
	return &pb.EliminarArchivoResponse{
		Exito:   true,
		Mensaje: "Archivo eliminado exitosamente",
	}, nil
}

func (c *RepoController) ConsultarRepositorio(ctx context.Context, req *pb.ConsultarRepositorioRequest) (*pb.ConsultarRepositorioResponse, error) {
	info, err := c.svc.ConsultarRepositorio(req.GetIdClase())
	if err != nil {
		return nil, toGrpcError(err)
	}

	archivos := make([]*pb.ArchivoRepositorio, 0, len(info.Archivos))
	for _, a := range info.Archivos {
		archivos = append(archivos, &pb.ArchivoRepositorio{
			IdArchivo: a.IDArchivo,
			Nombre:    a.Nombre,
		})
	}

	return &pb.ConsultarRepositorioResponse{
		Exito:   true,
		Mensaje: "Repositorio consultado exitosamente",
		Repositorio: &pb.RepositorioInfo{
			IdRepositorio: info.IDRepositorio,
			IdClase:       info.IDClase,
			Nombre:        info.Nombre,
			Archivos:      archivos,
		},
	}, nil
}

func (c *RepoController) ConsultarVersionesArchivo(ctx context.Context, req *pb.ConsultarVersionesArchivoRequest) (*pb.ConsultarVersionesArchivoResponse, error) {
	versiones, err := c.svc.ConsultarVersionesArchivo(req.GetIdArchivo())
	if err != nil {
		return nil, toGrpcError(err)
	}

	pbVersiones := make([]*pb.VersionArchivo, 0, len(versiones))
	for _, v := range versiones {
		pbVersiones = append(pbVersiones, &pb.VersionArchivo{
			IdVersion:      v.IDVersion,
			IdArchivo:      v.IDArchivo,
			Link:           v.Link,
			Tag:            v.Tag,
			FechaCreacion:  v.FechaCreacion,
			Hash:           v.Hash,
			Latest:         v.EsLatest,
		})
	}

	return &pb.ConsultarVersionesArchivoResponse{
		Exito:    true,
		Mensaje:  "Versiones consultadas exitosamente",
		Versiones: pbVersiones,
	}, nil
}

func (c *RepoController) ConsultarVersionArchivo(ctx context.Context, req *pb.ConsultarVersionArchivoRequest) (*pb.ConsultarVersionArchivoResponse, error) {
	v, err := c.svc.ConsultarVersionArchivo(req.GetIdArchivo(), req.GetIdVersion())
	if err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.ConsultarVersionArchivoResponse{
		Exito:   true,
		Mensaje: "Versión consultada exitosamente",
		Version: &pb.VersionArchivo{
			IdVersion:      v.IDVersion,
			IdArchivo:      v.IDArchivo,
			Link:           v.Link,
			Tag:            v.Tag,
			FechaCreacion:  v.FechaCreacion,
			Hash:           v.Hash,
			Latest:         v.EsLatest,
		},
	}, nil
}
