package services

import (
	"database/sql"

	"servicio_recursos/repositories"
	"servicio_recursos/types"
)

type ForumService interface {
	ConsultarDudasClase(idClase, pagina int32) ([]types.DudaInfo, int32, error)
	CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error)
	CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error)
	MarcarRespuesta(idRespuesta, idUsuario int32) error
}

type ForumServiceImp struct {
	repo repositories.ForumRepository
}

func NewForumService(repo repositories.ForumRepository) *ForumServiceImp {
	return &ForumServiceImp{repo: repo}
}

const forumPorPagina = 10

func (s *ForumServiceImp) ConsultarDudasClase(idClase, pagina int32) ([]types.DudaInfo, int32, error) {
	if idClase <= 0 {
		return nil, 0, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if pagina <= 0 {
		pagina = 1
	}

	dudas, totalPaginas, err := s.repo.ConsultarDudasClase(idClase, pagina, forumPorPagina)
	if err != nil {
		if err == sql.ErrNoRows {
			return []types.DudaInfo{}, 0, nil
		}
		return nil, 0, types.NewInternalError(err.Error())
	}
	return dudas, totalPaginas, nil
}

func (s *ForumServiceImp) CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
	if idClase <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if idUsuario <= 0 {
		return 0, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if duda == "" {
		return 0, types.NewInvalidArgumentError("La duda es obligatoria")
	}
	if segundo != nil && *segundo < 0 {
		return 0, types.NewInvalidArgumentError("El segundo debe ser un valor no negativo")
	}

	id, err := s.repo.CrearDuda(idClase, idUsuario, duda, segundo)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *ForumServiceImp) CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error) {
	if idDuda <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la duda es obligatorio")
	}
	if idUsuario <= 0 {
		return 0, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if respuesta == "" {
		return 0, types.NewInvalidArgumentError("La respuesta es obligatoria")
	}

	id, err := s.repo.CrearRespuesta(idDuda, idUsuario, respuesta)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *ForumServiceImp) MarcarRespuesta(idRespuesta, idUsuario int32) error {
	if idRespuesta <= 0 {
		return types.NewInvalidArgumentError("El id de la respuesta es obligatorio")
	}
	if idUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	if err := s.repo.MarcarRespuesta(idRespuesta, idUsuario); err != nil {
		if err == sql.ErrNoRows {
			return types.NewNotFoundError("No se encontró la respuesta o no pertenece a una duda del usuario")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}
