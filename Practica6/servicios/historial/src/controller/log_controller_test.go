package controller

import (
	"context"
	"errors"
	"testing"

	pb "servicio-historial/proto/historial"
	"servicio-historial/services"
	"servicio-historial/types"
)

type logServiceMock struct {
	consultarFn func(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error)
}

var _ services.LogService = (*logServiceMock)(nil)

func (m *logServiceMock) Consultar(params types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
	if m.consultarFn != nil {
		return m.consultarFn(params)
	}
	return types.ConsultarAuditLogsResult{}, nil
}

func TestLogController_ConsultarAuditLogs_Exito(t *testing.T) {
	svc := &logServiceMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{
				Registros: []types.AuditLog{{
					IDAuditoria: 1, UsuarioResponsable: 1, Operacion: "INSERT",
					TablaAfectada: "usuarios", FechaEvento: "2025-01-15",
				}},
				TotalPaginas: 1,
			}, nil
		},
	}
	ctrl := NewLogController(svc)
	resp, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{
		Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
	if len(resp.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(resp.Registros))
	}
}

func TestLogController_ConsultarAuditLogs_ConEstados(t *testing.T) {
	antes := "antes"
	despues := "despues"
	svc := &logServiceMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{
				Registros: []types.AuditLog{{
					IDAuditoria: 1, UsuarioResponsable: 1, Operacion: "UPDATE",
					TablaAfectada: "usuarios", FechaEvento: "2025-01-15",
					EstadoAnterior: &antes, EstadoNuevo: &despues,
				}},
				TotalPaginas: 1,
			}, nil
		},
	}
	ctrl := NewLogController(svc)
	resp, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{
		Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if resp.Registros[0].EstadoAnterior != "antes" {
		t.Fatalf("esperaba 'antes', obtuvo '%s'", resp.Registros[0].EstadoAnterior)
	}
	if resp.Registros[0].EstadoNuevo != "despues" {
		t.Fatalf("esperaba 'despues', obtuvo '%s'", resp.Registros[0].EstadoNuevo)
	}
}

func TestLogController_ConsultarAuditLogs_Error(t *testing.T) {
	svc := &logServiceMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{}, types.NewInternalError("fallo")
		},
	}
	ctrl := NewLogController(svc)
	_, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{
		Pagina: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogController_ConsultarAuditLogs_PlainError(t *testing.T) {
	svc := &logServiceMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{}, errors.New("error generico")
		},
	}
	ctrl := NewLogController(svc)
	_, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{
		Pagina: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestLogController_ConsultarAuditLogs_Vacio(t *testing.T) {
	svc := &logServiceMock{
		consultarFn: func(p types.ConsultarAuditLogsParams) (types.ConsultarAuditLogsResult, error) {
			return types.ConsultarAuditLogsResult{Registros: []types.AuditLog{}, TotalPaginas: 0}, nil
		},
	}
	ctrl := NewLogController(svc)
	resp, err := ctrl.ConsultarAuditLogs(context.Background(), &pb.ConsultarAuditLogsRequest{Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Registros) != 0 {
		t.Fatalf("esperaba 0 registros, obtuvo %d", len(resp.Registros))
	}
}
