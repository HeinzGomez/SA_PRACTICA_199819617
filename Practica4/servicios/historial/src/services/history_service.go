package services

import (
	"database/sql"
	"errors"

	"servicio-historial/repositories"
	"servicio-historial/types"
)

type HistoryService interface {
	RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error)
	ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error)
	MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error)
	ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error)
	ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error)
	ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error)
	EliminarHistorialClase(params types.EliminarHistorialParams) error
}

type HistoryServiceImp struct {
	historyRepo repositories.HistoryRepository
}

func NewHistoryService(historyRepo repositories.HistoryRepository) *HistoryServiceImp {
	return &HistoryServiceImp{historyRepo: historyRepo}
}

func (s *HistoryServiceImp) RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
	if err := validarRegistroProgreso(params); err != nil {
		return types.HistorialReproduccion{}, err
	}

	historial, err := s.historyRepo.RegistrarProgreso(params)
	if err != nil {
		return types.HistorialReproduccion{}, types.NewInternalError(err.Error())
	}
	return historial, nil
}

func (s *HistoryServiceImp) ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
	if params.IDUsuario <= 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if params.IDClase <= 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if params.IDTema < 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El id del tema no puede ser negativo")
	}
	if params.MinutoActual < 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El minuto actual no puede ser negativo")
	}
	if params.SegundoActual < 0 || params.SegundoActual > 59 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El segundo actual debe estar entre 0 y 59")
	}

	checkpoint, err := s.historyRepo.ActualizarCheckpoint(params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.CheckpointClase{}, types.NewNotFoundError("No existe historial de reproducción para el usuario y la clase indicados")
		}
		return types.CheckpointClase{}, types.NewInternalError(err.Error())
	}
	return checkpoint, nil
}

func (s *HistoryServiceImp) MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error) {
	if idUsuario <= 0 {
		return types.HistorialReproduccion{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if idClase <= 0 {
		return types.HistorialReproduccion{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	historial, err := s.historyRepo.MarcarClaseCompletada(idUsuario, idClase)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.HistorialReproduccion{}, types.NewNotFoundError("No existe historial de reproducción para el usuario y la clase indicados")
		}
		return types.HistorialReproduccion{}, types.NewInternalError(err.Error())
	}
	return historial, nil
}

func (s *HistoryServiceImp) ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error) {
	if idUsuario <= 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if idClase <= 0 {
		return types.CheckpointClase{}, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	checkpoint, err := s.historyRepo.ObtenerCheckpointClase(idUsuario, idClase)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.CheckpointClase{}, types.NewNotFoundError("No existe historial de reproducción para el usuario y la clase indicados")
		}
		return types.CheckpointClase{}, types.NewInternalError(err.Error())
	}
	return checkpoint, nil
}

func (s *HistoryServiceImp) ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
	if params.IDUsuario <= 0 {
		return types.ConsultarHistorialResult{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if params.Pagina < 1 {
		return types.ConsultarHistorialResult{}, types.NewInvalidArgumentError("La página debe ser un número mayor o igual a 1")
	}

	result, err := s.historyRepo.ConsultarHistorialUsuario(params)
	if err != nil {
		return types.ConsultarHistorialResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}

func (s *HistoryServiceImp) ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error) {
	if idUsuario <= 0 {
		return types.EstadisticasUsuario{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	estadisticas, err := s.historyRepo.ConsultarEstadisticasUsuario(idUsuario)
	if err != nil {
		return types.EstadisticasUsuario{}, types.NewInternalError(err.Error())
	}
	return estadisticas, nil
}

func (s *HistoryServiceImp) EliminarHistorialClase(params types.EliminarHistorialParams) error {
	if params.IDUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if params.IDClase <= 0 {
		return types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}

	if err := s.historyRepo.EliminarHistorialClase(params); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return types.NewNotFoundError("No existe historial de reproducción para el usuario y la clase indicados")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func validarRegistroProgreso(params types.RegistrarProgresoParams) error {
	switch {
	case params.IDUsuario <= 0:
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	case params.IDClase <= 0:
		return types.NewInvalidArgumentError("El id de la clase es obligatorio")
	case params.IDTema < 0:
		return types.NewInvalidArgumentError("El id del tema no puede ser negativo")
	case params.MinutoActual < 0:
		return types.NewInvalidArgumentError("El minuto actual no puede ser negativo")
	case params.SegundoActual < 0 || params.SegundoActual > 59:
		return types.NewInvalidArgumentError("El segundo actual debe estar entre 0 y 59")
	case params.DuracionTotal <= 0:
		return types.NewInvalidArgumentError("La duración total debe ser mayor a cero")
	}
	return nil
}
