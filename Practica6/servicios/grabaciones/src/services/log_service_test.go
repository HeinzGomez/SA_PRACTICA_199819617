package services

import (
	"testing"

	"servicio-grabaciones/types"
)

type logRepoForLogSvc struct {
	result types.ConsultarAuditLogsResult
	err    error
}

func (m *logRepoForLogSvc) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	return m.result, m.err
}

func TestLogServiceSvc_Consultar_Exito(t *testing.T) {
	repo := &logRepoForLogSvc{result: types.ConsultarAuditLogsResult{TotalPaginas: 1}}
	svc := NewLogService(repo)
	result, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: 0, TablaFiltro: ""})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalPaginas != 1 {
		t.Fatalf("esperaba 1 pagina, obtuvo %d", result.TotalPaginas)
	}
}

func TestLogServiceSvc_Consultar_PaginaCero(t *testing.T) {
	svc := NewLogService(&logRepoForLogSvc{})
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 0})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestLogServiceSvc_Consultar_PaginaNegativa(t *testing.T) {
	svc := NewLogService(&logRepoForLogSvc{})
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: -1})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestLogServiceSvc_Consultar_UsuarioFiltroNegativo(t *testing.T) {
	svc := NewLogService(&logRepoForLogSvc{})
	_, err := svc.Consultar(types.ConsultarAuditLogsParams{Pagina: 1, UsuarioFiltro: -1})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}
