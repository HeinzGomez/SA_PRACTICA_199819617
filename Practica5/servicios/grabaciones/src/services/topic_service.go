package services

import (
	"database/sql"
	"errors"
	"strings"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

type TopicService interface {
	CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error)
	EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error)
	EliminarUnidad(idUnidad int32) error
	ConsultarUnidades() ([]types.Unidad, error)
	CrearTema(params types.CrearTemaParams) (types.Tema, error)
	EditarTema(params types.EditarTemaParams) (types.Tema, error)
	EliminarTema(idTema int32) error
	ConsultarTemas(idUnidad int32) ([]types.Tema, error)
}

type TopicServiceImp struct {
	topicRepo repositories.TopicRepository
}

func NewTopicService(topicRepo repositories.TopicRepository) *TopicServiceImp {
	return &TopicServiceImp{topicRepo: topicRepo}
}

func (s *TopicServiceImp) CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error) {
	if err := s.validarNombre(params.Nombre); err != nil {
		return types.Unidad{}, err
	}

	unidad, err := s.topicRepo.CrearUnidad(params)
	if err != nil {
		return types.Unidad{}, types.NewInternalError(err.Error())
	}
	return unidad, nil
}

func (s *TopicServiceImp) EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error) {
	if params.ID <= 0 {
		return types.Unidad{}, types.NewInvalidArgumentError("El id de la unidad es obligatorio")
	}
	if err := s.validarNombre(params.Nombre); err != nil {
		return types.Unidad{}, err
	}
	if err := s.unidadExiste(params.ID); err != nil {
		return types.Unidad{}, err
	}

	unidad, err := s.topicRepo.EditarUnidad(params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.Unidad{}, types.NewNotFoundError("La unidad indicada no existe")
		}
		return types.Unidad{}, types.NewInternalError(err.Error())
	}
	return unidad, nil
}

func (s *TopicServiceImp) EliminarUnidad(idUnidad int32) error {
	if idUnidad <= 0 {
		return types.NewInvalidArgumentError("El id de la unidad es obligatorio")
	}
	if err := s.unidadExiste(idUnidad); err != nil {
		return err
	}

	total, err := s.topicRepo.ContarTemasPorUnidad(idUnidad)
	if err != nil {
		return types.NewInternalError(err.Error())
	}
	if total > 0 {
		return types.NewInvalidArgumentError("La unidad no puede eliminarse porque tiene temas asociados")
	}

	if err := s.topicRepo.EliminarUnidad(idUnidad); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("La unidad indicada no existe")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *TopicServiceImp) ConsultarUnidades() ([]types.Unidad, error) {
	unidades, err := s.topicRepo.ConsultarUnidades()
	if err != nil {
		return nil, types.NewInternalError(err.Error())
	}
	return unidades, nil
}

func (s *TopicServiceImp) CrearTema(params types.CrearTemaParams) (types.Tema, error) {
	if params.UnidadID <= 0 {
		return types.Tema{}, types.NewInvalidArgumentError("El id de la unidad es obligatorio")
	}
	if err := s.validarNombre(params.Nombre); err != nil {
		return types.Tema{}, err
	}
	if err := s.unidadExiste(params.UnidadID); err != nil {
		return types.Tema{}, err
	}

	tema, err := s.topicRepo.CrearTema(params)
	if err != nil {
		return types.Tema{}, types.NewInternalError(err.Error())
	}
	return tema, nil
}

func (s *TopicServiceImp) EditarTema(params types.EditarTemaParams) (types.Tema, error) {
	if params.ID <= 0 {
		return types.Tema{}, types.NewInvalidArgumentError("El id del tema es obligatorio")
	}
	if params.UnidadID <= 0 {
		return types.Tema{}, types.NewInvalidArgumentError("El id de la unidad es obligatorio")
	}
	if err := s.validarNombre(params.Nombre); err != nil {
		return types.Tema{}, err
	}
	if err := s.unidadExiste(params.UnidadID); err != nil {
		return types.Tema{}, err
	}

	_, err := s.topicRepo.BuscarTemaPorId(params.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.Tema{}, types.NewNotFoundError("El tema indicado no existe")
		}
		return types.Tema{}, types.NewInternalError(err.Error())
	}

	tema, err := s.topicRepo.EditarTema(params)
	if err != nil {
		return types.Tema{}, types.NewInternalError(err.Error())
	}
	return tema, nil
}

func (s *TopicServiceImp) EliminarTema(idTema int32) error {
	if idTema <= 0 {
		return types.NewInvalidArgumentError("El id del tema es obligatorio")
	}

	_, err := s.topicRepo.BuscarTemaPorId(idTema)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("El tema indicado no existe")
		}
		return types.NewInternalError(err.Error())
	}

	if err := s.topicRepo.EliminarTema(idTema); err != nil {
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *TopicServiceImp) ConsultarTemas(idUnidad int32) ([]types.Tema, error) {
	if idUnidad < 0 {
		return nil, types.NewInvalidArgumentError("El id de la unidad no puede ser negativo")
	}

	temas, err := s.topicRepo.ConsultarTemas(idUnidad)
	if err != nil {
		return nil, types.NewInternalError(err.Error())
	}
	return temas, nil
}

func (s *TopicServiceImp) validarNombre(nombre string) error {
	if strings.TrimSpace(nombre) == "" {
		return types.NewInvalidArgumentError("El nombre es obligatorio")
	}
	return nil
}

func (s *TopicServiceImp) unidadExiste(idUnidad int32) error {
	if _, err := s.topicRepo.BuscarUnidadPorId(idUnidad); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("La unidad indicada no existe")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}
