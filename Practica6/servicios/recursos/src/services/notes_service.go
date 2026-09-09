package services

import (
	"database/sql"
	"errors"

	"servicio_recursos/repositories"
	"servicio_recursos/types"
)

type NotesService interface {
	ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error)
	CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error)
	ActualizarApunte(idApunte int32, titulo, contenido string) error
	AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error)
	EliminarMarcadorTiempo(idMarcador int32) error
}

type NotesServiceImp struct {
	repo repositories.NotesRepository
}

func NewNotesService(repo repositories.NotesRepository) *NotesServiceImp {
	return &NotesServiceImp{repo: repo}
}

func (s *NotesServiceImp) ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error) {
	if idClase <= 0 {
		return types.ApunteInfo{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if idUsuario <= 0 {
		return types.ApunteInfo{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	apunte, err := s.repo.ConsultarApunte(idClase, idUsuario)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.ApunteInfo{}, types.NewNotFoundError("No se encontraron apuntes para esta clase y usuario")
		}
		return types.ApunteInfo{}, types.NewInternalError(err.Error())
	}
	return apunte, nil
}

func (s *NotesServiceImp) CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
	if idClase <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if idUsuario <= 0 {
		return 0, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if titulo == "" {
		return 0, types.NewInvalidArgumentError("El título es obligatorio")
	}

	id, err := s.repo.CrearApunte(idClase, idUsuario, titulo, contenido)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *NotesServiceImp) ActualizarApunte(idApunte int32, titulo, contenido string) error {
	if idApunte <= 0 {
		return types.NewInvalidArgumentError("El id del apunte es obligatorio")
	}
	if titulo == "" {
		return types.NewInvalidArgumentError("El título es obligatorio")
	}

	if err := s.repo.ActualizarApunte(idApunte, titulo, contenido); err != nil {
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *NotesServiceImp) AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error) {
	if idApunte <= 0 {
		return 0, types.NewInvalidArgumentError("El id del apunte es obligatorio")
	}
	if segundo < 0 {
		return 0, types.NewInvalidArgumentError("El segundo debe ser un valor no negativo")
	}

	id, err := s.repo.AgregarMarcadorTiempo(idApunte, segundo, texto)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *NotesServiceImp) EliminarMarcadorTiempo(idMarcador int32) error {
	if idMarcador <= 0 {
		return types.NewInvalidArgumentError("El id del marcador es obligatorio")
	}

	if err := s.repo.EliminarMarcadorTiempo(idMarcador); err != nil {
		return types.NewInternalError(err.Error())
	}
	return nil
}
