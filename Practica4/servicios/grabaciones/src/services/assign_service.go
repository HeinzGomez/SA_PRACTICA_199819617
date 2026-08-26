package services

import (
	"database/sql"
	"errors"
	"strings"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

type AssignService interface {
	AsignarDocente(params types.AsignarDocenteParams) error
	AsignarAuxiliar(params types.AsignarAuxiliarParams) error
	AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error)
	AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error
	DesasignarDocente(params types.DesasignarDocenteParams) error
	DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error
	DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error
	DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error
	ConsultarParticipantesClase(idClase int32) ([]types.Participante, error)
}

type AssignServiceImp struct {
	assignRepo repositories.AssignRepository
	classRepo  repositories.ClassRepository
	topicRepo  repositories.TopicRepository
}

func NewAssignService(
	assignRepo repositories.AssignRepository,
	classRepo repositories.ClassRepository,
	topicRepo repositories.TopicRepository,
) *AssignServiceImp {
	return &AssignServiceImp{
		assignRepo: assignRepo,
		classRepo:  classRepo,
		topicRepo:  topicRepo,
	}
}

func (s *AssignServiceImp) AsignarDocente(params types.AsignarDocenteParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarUsuario(params.IDUsuario); err != nil {
		return err
	}
	if err := s.claseExiste(params.IDClase); err != nil {
		return err
	}

	participantes, err := s.assignRepo.ConsultarParticipantesClase(params.IDClase)
	if err != nil {
		return types.NewInternalError(err.Error())
	}
	for _, participante := range participantes {
		if participante.TipoParticipante == "DOCENTE" && participante.IDUsuario == params.IDUsuario {
			return types.NewAlreadyExistsError("El docente ya fue asignado a la clase")
		}
	}

	return s.mapAssignError(s.assignRepo.AsignarDocente(params))
}

func (s *AssignServiceImp) AsignarAuxiliar(params types.AsignarAuxiliarParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarUsuario(params.IDUsuario); err != nil {
		return err
	}
	if err := s.claseExiste(params.IDClase); err != nil {
		return err
	}

	participantes, err := s.assignRepo.ConsultarParticipantesClase(params.IDClase)
	if err != nil {
		return types.NewInternalError(err.Error())
	}
	for _, participante := range participantes {
		if participante.TipoParticipante == "AUXILIAR" && participante.IDUsuario == params.IDUsuario {
			return types.NewAlreadyExistsError("El auxiliar ya fue asignado a la clase")
		}
	}

	return s.mapAssignError(s.assignRepo.AsignarAuxiliar(params))
}

func (s *AssignServiceImp) AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error) {
	if err := s.validarClase(params.IDClase); err != nil {
		return types.MaterialApoyo{}, err
	}
	if strings.TrimSpace(params.Nombre) == "" {
		return types.MaterialApoyo{}, types.NewInvalidArgumentError("El nombre del material es obligatorio")
	}
	if strings.TrimSpace(params.Tipo) == "" {
		return types.MaterialApoyo{}, types.NewInvalidArgumentError("El tipo del material es obligatorio")
	}
	if strings.TrimSpace(params.URL) == "" {
		return types.MaterialApoyo{}, types.NewInvalidArgumentError("La url del material es obligatoria")
	}
	if err := s.claseExiste(params.IDClase); err != nil {
		return types.MaterialApoyo{}, err
	}

	material, err := s.assignRepo.AsignarMaterialApoyo(params)
	if err != nil {
		return types.MaterialApoyo{}, s.mapAssignError(err)
	}
	return material, nil
}

func (s *AssignServiceImp) AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarTema(params.IDTema); err != nil {
		return err
	}
	if err := s.claseExiste(params.IDClase); err != nil {
		return err
	}
	if _, err := s.topicRepo.BuscarTemaPorId(params.IDTema); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("El tema indicado no existe")
		}
		return types.NewInternalError(err.Error())
	}

	fichas, err := s.classRepo.ConsultarFichaTecnica(params.IDClase)
	if err != nil {
		return types.NewInternalError(err.Error())
	}
	for _, fila := range fichas {
		if fila.TemaID != nil && *fila.TemaID == params.IDTema {
			return types.NewAlreadyExistsError("El tema ya está asociado a la clase")
		}
	}

	return s.mapAssignError(s.assignRepo.AsignarTemaClaseGrabada(params))
}

func (s *AssignServiceImp) DesasignarDocente(params types.DesasignarDocenteParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarUsuario(params.IDUsuario); err != nil {
		return err
	}
	return s.mapAssignError(s.assignRepo.DesasignarDocente(params))
}

func (s *AssignServiceImp) DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarUsuario(params.IDUsuario); err != nil {
		return err
	}
	return s.mapAssignError(s.assignRepo.DesasignarAuxiliar(params))
}

func (s *AssignServiceImp) DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error {
	if params.IDMaterial <= 0 {
		return types.NewInvalidArgumentError("El id del material es obligatorio")
	}
	return s.mapAssignError(s.assignRepo.DesasignarMaterialApoyo(params))
}

func (s *AssignServiceImp) DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error {
	if err := s.validarClase(params.IDClase); err != nil {
		return err
	}
	if err := s.validarTema(params.IDTema); err != nil {
		return err
	}
	return s.mapAssignError(s.assignRepo.DesasignarTemaClaseGrabada(params))
}

func (s *AssignServiceImp) ConsultarParticipantesClase(idClase int32) ([]types.Participante, error) {
	if err := s.validarClase(idClase); err != nil {
		return nil, err
	}
	if err := s.claseExiste(idClase); err != nil {
		return nil, err
	}

	participantes, err := s.assignRepo.ConsultarParticipantesClase(idClase)
	if err != nil {
		return nil, types.NewInternalError(err.Error())
	}
	return participantes, nil
}

func (s *AssignServiceImp) validarClase(idClase int32) error {
	if idClase <= 0 {
		return types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	return nil
}

func (s *AssignServiceImp) validarUsuario(idUsuario int32) error {
	if idUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	return nil
}

func (s *AssignServiceImp) validarTema(idTema int32) error {
	if idTema <= 0 {
		return types.NewInvalidArgumentError("El id del tema es obligatorio")
	}
	return nil
}

func (s *AssignServiceImp) claseExiste(idClase int32) error {
	if _, err := s.classRepo.BuscarClaseGrabada(idClase); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("La clase grabada indicada no existe")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *AssignServiceImp) mapAssignError(err error) error {
	if err == nil {
		return nil
	}
	message := err.Error()
	switch {
	case strings.Contains(message, "ya fue asignado"):
		return types.NewAlreadyExistsError(message)
	case strings.Contains(message, "ya está asociado"):
		return types.NewAlreadyExistsError(message)
	case strings.Contains(message, "no existe"):
		return types.NewNotFoundError(message)
	default:
		return types.NewInternalError(message)
	}
}
