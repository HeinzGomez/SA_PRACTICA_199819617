package controller

import (
	"context"
	"testing"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/types"
)

type logSvcForController struct {
	result types.ConsultarAuditLogsResult
	err    error
}

func (m *logSvcForController) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	return m.result, m.err
}

func TestLogController_Consultar_Exito(t *testing.T) {
	svc := &logSvcForController{result: types.ConsultarAuditLogsResult{TotalPaginas: 1}}
	ctrl := NewLogController(svc)
	resp, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestLogController_Consultar_Error(t *testing.T) {
	svc := &logSvcForController{err: types.NewInvalidArgumentError("pagina invalida")}
	ctrl := NewLogController(svc)
	_, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{Pagina: 0})
	if err == nil {
		t.Fatalf("esperaba error")
	}
}
