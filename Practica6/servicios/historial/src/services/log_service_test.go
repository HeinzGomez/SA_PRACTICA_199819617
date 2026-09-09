package services

import (
	"errors"
	"testing"

	"servicio-historial/repositories"
	"servicio-historial/types"
)

type logRepoMock struct {
	consultarFn func(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error)
}

var _ repositories.LogRepository = (*logRepoMock)(nil)

func (m *logRepoMock) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	if m.consultarFn != nil {
		return m.consultarFn(params)
	}
	return types.ConsultarAuditLogsResult{}, nil
}

func TestLogConsultar_Exito(t *testing.T) {
	repo := &logRepoMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{
				Registros:    []types.AuditLog{{IDAuditoria: 1}},
				TotalPaginas: 1,
			}, nil
		},
	}
	svc := NewLogService(repo)
	result, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(result.Registros))
	}
}

func TestLogConsultar_PaginaInvalida(t *testing.T) {
	svc := NewLogService(&logRepoMock{})
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogConsultar_UsuarioFiltroNegativo(t *testing.T) {
	svc := NewLogService(&logRepoMock{})
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: -1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogConsultar_RepoError(t *testing.T) {
	repo := &logRepoMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{}, errors.New("db error")
		},
	}
	svc := NewLogService(repo)
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}
