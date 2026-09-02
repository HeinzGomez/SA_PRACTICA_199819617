// HeinzGomez - Lógica de negocio de capítulos: validación de marcas de tiempo y reglas de segmentación
package services

import (
	"database/sql"
	"errors"
	"strings"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

const tituloCapituloMaxLen = 150

type CapituloService interface {
	CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error)
	EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error)
	EliminarCapitulo(idCapitulo int32) error
	ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error)
}

type CapituloServiceImp struct {
	capituloRepo repositories.CapituloRepository
	classRepo    repositories.ClassRepository
}

func NewCapituloService(capituloRepo repositories.CapituloRepository, classRepo repositories.ClassRepository) *CapituloServiceImp {
	return &CapituloServiceImp{capituloRepo: capituloRepo, classRepo: classRepo}
}

// HeinzGomez - Validación pura de una marca de tiempo de capítulo (reutilizable en pruebas unitarias sin BD)
func ValidarCapitulo(titulo string, tiempoInicio int32, duracionSegundos int32) error {
	tituloLimpio := strings.TrimSpace(titulo)
	if tituloLimpio == "" {
		return types.NewInvalidArgumentError("El título del capítulo es obligatorio")
	}
	if len([]rune(tituloLimpio)) > tituloCapituloMaxLen {
		return types.NewInvalidArgumentError("El título del capítulo excede la longitud máxima permitida")
	}
	if tiempoInicio < 0 {
		return types.NewInvalidArgumentError("La marca de tiempo no puede ser negativa")
	}
	if duracionSegundos > 0 && tiempoInicio > duracionSegundos {
		return types.NewInvalidArgumentError("La marca de tiempo excede la duración de la clase")
	}
	return nil
}

func (s *CapituloServiceImp) CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error) {
	if params.IDClase <= 0 {
		return types.Capitulo{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	duracionSegundos, err := s.duracionClaseSegundos(params.IDClase)
	if err != nil {
		return types.Capitulo{}, err
	}
	if err := ValidarCapitulo(params.Titulo, params.TiempoInicio, duracionSegundos); err != nil {
		return types.Capitulo{}, err
	}

	existe, err := s.capituloRepo.ExisteTiempoEnClase(params.IDClase, params.TiempoInicio, 0)
	if err != nil {
		return types.Capitulo{}, types.NewInternalError(err.Error())
	}
	if existe {
		return types.Capitulo{}, types.NewAlreadyExistsError("Ya existe un capítulo en esa marca de tiempo para la clase")
	}

	params.Titulo = strings.TrimSpace(params.Titulo)
	capitulo, err := s.capituloRepo.CrearCapitulo(params)
	if err != nil {
		return types.Capitulo{}, types.NewInternalError(err.Error())
	}
	return capitulo, nil
}

func (s *CapituloServiceImp) EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error) {
	if params.ID <= 0 {
		return types.Capitulo{}, types.NewInvalidArgumentError("El id del capítulo es obligatorio")
	}

	actual, err := s.capituloRepo.BuscarCapituloPorId(params.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.Capitulo{}, types.NewNotFoundError("El capítulo indicado no existe")
		}
		return types.Capitulo{}, types.NewInternalError(err.Error())
	}

	duracionSegundos, err := s.duracionClaseSegundos(actual.IDClase)
	if err != nil {
		return types.Capitulo{}, err
	}
	if err := ValidarCapitulo(params.Titulo, params.TiempoInicio, duracionSegundos); err != nil {
		return types.Capitulo{}, err
	}

	existe, err := s.capituloRepo.ExisteTiempoEnClase(actual.IDClase, params.TiempoInicio, params.ID)
	if err != nil {
		return types.Capitulo{}, types.NewInternalError(err.Error())
	}
	if existe {
		return types.Capitulo{}, types.NewAlreadyExistsError("Ya existe un capítulo en esa marca de tiempo para la clase")
	}

	params.Titulo = strings.TrimSpace(params.Titulo)
	capitulo, err := s.capituloRepo.EditarCapitulo(params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.Capitulo{}, types.NewNotFoundError("El capítulo indicado no existe")
		}
		return types.Capitulo{}, types.NewInternalError(err.Error())
	}
	return capitulo, nil
}

func (s *CapituloServiceImp) EliminarCapitulo(idCapitulo int32) error {
	if idCapitulo <= 0 {
		return types.NewInvalidArgumentError("El id del capítulo es obligatorio")
	}
	if err := s.capituloRepo.EliminarCapitulo(idCapitulo); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("El capítulo indicado no existe")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *CapituloServiceImp) ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error) {
	if idClase <= 0 {
		return nil, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	capitulos, err := s.capituloRepo.ConsultarCapitulosClase(idClase)
	if err != nil {
		return nil, types.NewInternalError(err.Error())
	}
	return capitulos, nil
}

// HeinzGomez - Obtiene la duración de la clase (min -> seg) para acotar las marcas de tiempo
func (s *CapituloServiceImp) duracionClaseSegundos(idClase int32) (int32, error) {
	clase, err := s.classRepo.BuscarClaseGrabada(idClase)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, types.NewNotFoundError("La clase indicada no existe")
		}
		return 0, types.NewInternalError(err.Error())
	}
	return clase.DuracionMin * 60, nil
}
