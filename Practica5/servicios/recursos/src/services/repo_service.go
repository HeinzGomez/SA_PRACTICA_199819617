package services

import (
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"servicio_recursos/repositories"
	"servicio_recursos/types"
)

func generateHash(idArchivo int32, link string) string {
	data := fmt.Sprintf("%d:%s:%d", idArchivo, link, time.Now().UnixNano())
	sum := sha256.Sum256([]byte(data))
	return fmt.Sprintf("%x", sum[:8])
}

type RepoService interface {
	CrearRepositorio(params types.CrearRepositorioParams) (int32, error)
	AgregarArchivo(params types.AgregarArchivoParams) (int32, error)
	ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error
	ActualizarTag(idVersion int32, tag string) error
	EliminarArchivo(idArchivo int32) error
	ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error)
	ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error)
	ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error)
}

type RepoServiceImp struct {
	repo repositories.RepoRepository
}

func NewRepoService(repo repositories.RepoRepository) *RepoServiceImp {
	return &RepoServiceImp{repo: repo}
}

func (s *RepoServiceImp) CrearRepositorio(params types.CrearRepositorioParams) (int32, error) {
	if params.IDClase <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if params.Nombre == "" {
		return 0, types.NewInvalidArgumentError("El nombre del repositorio es obligatorio")
	}

	id, err := s.repo.CrearRepositorio(params)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *RepoServiceImp) AgregarArchivo(params types.AgregarArchivoParams) (int32, error) {
	if params.IDRepositorio <= 0 {
		return 0, types.NewInvalidArgumentError("El id del repositorio es obligatorio")
	}
	if params.Nombre == "" {
		return 0, types.NewInvalidArgumentError("El nombre del archivo es obligatorio")
	}
	if params.Link == "" {
		return 0, types.NewInvalidArgumentError("El link del archivo es obligatorio")
	}

	params.Hash = generateHash(0, params.Link)

	id, err := s.repo.AgregarArchivo(params)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *RepoServiceImp) ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error {
	if params.IDArchivo <= 0 {
		return types.NewInvalidArgumentError("El id del archivo es obligatorio")
	}
	if params.Link == "" {
		return types.NewInvalidArgumentError("El link de la versión es obligatorio")
	}

	params.Hash = generateHash(params.IDArchivo, params.Link)

	if err := s.repo.ActualizarVersionArchivo(params); err != nil {
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *RepoServiceImp) ActualizarTag(idVersion int32, tag string) error {
	if idVersion <= 0 {
		return types.NewInvalidArgumentError("El id de la versión es obligatorio")
	}
	if err := s.repo.ActualizarTag(idVersion, tag); err != nil {
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *RepoServiceImp) EliminarArchivo(idArchivo int32) error {
	if idArchivo <= 0 {
		return types.NewInvalidArgumentError("El id del archivo es obligatorio")
	}

	if err := s.repo.EliminarArchivo(idArchivo); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("No se encontró el archivo especificado")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *RepoServiceImp) ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error) {
	if idClase <= 0 {
		return types.RepositorioInfo{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	info, err := s.repo.ConsultarRepositorio(idClase)
	if err != nil {
		return types.RepositorioInfo{}, types.NewInternalError(err.Error())
	}
	if info.IDRepositorio == 0 {
		return types.RepositorioInfo{}, types.NewNotFoundError("No se encontró un repositorio para la clase especificada")
	}
	return info, nil
}

func (s *RepoServiceImp) ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error) {
	if idArchivo <= 0 {
		return nil, types.NewInvalidArgumentError("El id del archivo es obligatorio")
	}

	versiones, err := s.repo.ConsultarVersionesArchivo(idArchivo)
	if err != nil {
		return nil, types.NewInternalError(err.Error())
	}
	return versiones, nil
}

func (s *RepoServiceImp) ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error) {
	if idArchivo <= 0 {
		return types.VersionArchivo{}, types.NewInvalidArgumentError("El id del archivo es obligatorio")
	}
	if idVersion <= 0 {
		return types.VersionArchivo{}, types.NewInvalidArgumentError("El id de la versión es obligatorio")
	}

	v, err := s.repo.ConsultarVersionArchivo(idArchivo, idVersion)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.VersionArchivo{}, types.NewNotFoundError("No se encontró la versión especificada")
		}
		return types.VersionArchivo{}, types.NewInternalError(err.Error())
	}
	return v, nil
}
