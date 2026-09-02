package services

import (
	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

type LogService interface {
	Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error)
}

type LogServiceImp struct {
	logRepo repositories.LogRepository
}

func NewLogService(logRepo repositories.LogRepository) *LogServiceImp {
	return &LogServiceImp{logRepo: logRepo}
}

func (s *LogServiceImp) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	if params.Pagina < 1 {
		return types.ConsultarAuditLogsResult{}, types.NewInvalidArgumentError("La página debe ser un número mayor o igual a 1")
	}
	if params.UsuarioFiltro < 0 {
		return types.ConsultarAuditLogsResult{}, types.NewInvalidArgumentError("El filtro de usuario no puede ser negativo")
	}

	result, err := s.logRepo.Consultar(params)
	if err != nil {
		return types.ConsultarAuditLogsResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}
