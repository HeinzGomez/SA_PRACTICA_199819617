package controller

import (
	"context"
	"errors"
	"testing"

	pb "servicio-historial/proto/historial"
	"servicio-historial/services"
	"servicio-historial/types"
)

type historyServiceMock struct {
	registrarProgresoFn     func(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error)
	actualizarCheckpointFn  func(params types.ActualizarCheckpointParams) (types.CheckpointClase, error)
	marcarClaseCompletadaFn func(idUsuario, idClase int32) (types.HistorialReproduccion, error)
	obtenerCheckpointFn     func(idUsuario, idClase int32) (types.CheckpointClase, error)
	consultarHistorialFn    func(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error)
	consultarEstadisticasFn func(idUsuario int32) (types.EstadisticasUsuario, error)
	eliminarHistorialFn     func(params types.EliminarHistorialParams) error
}

var _ services.HistoryService = (*historyServiceMock)(nil)

func (m *historyServiceMock) RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
	if m.registrarProgresoFn != nil {
		return m.registrarProgresoFn(params)
	}
	return types.HistorialReproduccion{}, nil
}

func (m *historyServiceMock) ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
	if m.actualizarCheckpointFn != nil {
		return m.actualizarCheckpointFn(params)
	}
	return types.CheckpointClase{}, nil
}

func (m *historyServiceMock) MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error) {
	if m.marcarClaseCompletadaFn != nil {
		return m.marcarClaseCompletadaFn(idUsuario, idClase)
	}
	return types.HistorialReproduccion{}, nil
}

func (m *historyServiceMock) ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error) {
	if m.obtenerCheckpointFn != nil {
		return m.obtenerCheckpointFn(idUsuario, idClase)
	}
	return types.CheckpointClase{}, nil
}

func (m *historyServiceMock) ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
	if m.consultarHistorialFn != nil {
		return m.consultarHistorialFn(params)
	}
	return types.ConsultarHistorialResult{}, nil
}

func (m *historyServiceMock) ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error) {
	if m.consultarEstadisticasFn != nil {
		return m.consultarEstadisticasFn(idUsuario)
	}
	return types.EstadisticasUsuario{}, nil
}

func (m *historyServiceMock) EliminarHistorialClase(params types.EliminarHistorialParams) error {
	if m.eliminarHistorialFn != nil {
		return m.eliminarHistorialFn(params)
	}
	return nil
}

// --- RegistrarProgreso ---

func TestHistoryController_RegistrarProgreso_Exito(t *testing.T) {
	svc := &historyServiceMock{
		registrarProgresoFn: func(p types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{IDHistorial: 1, IDUsuario: p.IDUsuario}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.RegistrarProgreso(context.Background(), &pb.RegistrarProgresoRequest{
		IdUsuario: 1, IdClase: 1, IdTema: 1, MinutoActual: 10, SegundoActual: 30, DuracionTotal: 120,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_RegistrarProgreso_Error(t *testing.T) {
	svc := &historyServiceMock{
		registrarProgresoFn: func(p types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, types.NewInvalidArgumentError("campo requerido")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.RegistrarProgreso(context.Background(), &pb.RegistrarProgresoRequest{
		IdUsuario: 0,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- ActualizarCheckpoint ---

func TestHistoryController_ActualizarCheckpoint_Exito(t *testing.T) {
	svc := &historyServiceMock{
		actualizarCheckpointFn: func(p types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
			return types.CheckpointClase{IDTema: p.IDTema}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.ActualizarCheckpoint(context.Background(), &pb.ActualizarCheckpointRequest{
		IdUsuario: 1, IdClase: 1, IdTema: 1, MinutoActual: 10, SegundoActual: 30,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_ActualizarCheckpoint_Error(t *testing.T) {
	svc := &historyServiceMock{
		actualizarCheckpointFn: func(p types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, types.NewNotFoundError("no existe")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.ActualizarCheckpoint(context.Background(), &pb.ActualizarCheckpointRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- MarcarClaseCompletada ---

func TestHistoryController_MarcarClaseCompletada_Exito(t *testing.T) {
	svc := &historyServiceMock{
		marcarClaseCompletadaFn: func(idU, idC int32) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{Completada: true}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.MarcarClaseCompletada(context.Background(), &pb.MarcarClaseCompletadaRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_MarcarClaseCompletada_Error(t *testing.T) {
	svc := &historyServiceMock{
		marcarClaseCompletadaFn: func(idU, idC int32) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, types.NewNotFoundError("no existe")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.MarcarClaseCompletada(context.Background(), &pb.MarcarClaseCompletadaRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- ObtenerCheckpointClase ---

func TestHistoryController_ObtenerCheckpointClase_Exito(t *testing.T) {
	svc := &historyServiceMock{
		obtenerCheckpointFn: func(idU, idC int32) (types.CheckpointClase, error) {
			return types.CheckpointClase{IDTema: 1}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.ObtenerCheckpointClase(context.Background(), &pb.ObtenerCheckpointClaseRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_ObtenerCheckpointClase_Error(t *testing.T) {
	svc := &historyServiceMock{
		obtenerCheckpointFn: func(idU, idC int32) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, types.NewInternalError("fallo")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.ObtenerCheckpointClase(context.Background(), &pb.ObtenerCheckpointClaseRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- ConsultarHistorialUsuario ---

func TestHistoryController_ConsultarHistorialUsuario_Exito(t *testing.T) {
	svc := &historyServiceMock{
		consultarHistorialFn: func(p types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
			return types.ConsultarHistorialResult{
				Registros:    []types.HistorialReproduccion{{IDHistorial: 1}},
				TotalPaginas: 1,
			}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.ConsultarHistorialUsuario(context.Background(), &pb.ConsultarHistorialUsuarioRequest{
		IdUsuario: 1, Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(resp.Registros))
	}
}

func TestHistoryController_ConsultarHistorialUsuario_Error(t *testing.T) {
	svc := &historyServiceMock{
		consultarHistorialFn: func(p types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
			return types.ConsultarHistorialResult{}, types.NewInternalError("fallo")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.ConsultarHistorialUsuario(context.Background(), &pb.ConsultarHistorialUsuarioRequest{
		IdUsuario: 1, Pagina: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- ConsultarEstadisticasUsuario ---

func TestHistoryController_ConsultarEstadisticasUsuario_Exito(t *testing.T) {
	svc := &historyServiceMock{
		consultarEstadisticasFn: func(idU int32) (types.EstadisticasUsuario, error) {
			return types.EstadisticasUsuario{TotalClases: 10}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.ConsultarEstadisticasUsuario(context.Background(), &pb.ConsultarEstadisticasUsuarioRequest{
		IdUsuario: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_ConsultarEstadisticasUsuario_Error(t *testing.T) {
	svc := &historyServiceMock{
		consultarEstadisticasFn: func(idU int32) (types.EstadisticasUsuario, error) {
			return types.EstadisticasUsuario{}, types.NewInternalError("fallo")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.ConsultarEstadisticasUsuario(context.Background(), &pb.ConsultarEstadisticasUsuarioRequest{
		IdUsuario: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- EliminarHistorialClase ---

func TestHistoryController_EliminarHistorialClase_Exito(t *testing.T) {
	svc := &historyServiceMock{
		eliminarHistorialFn: func(p types.EliminarHistorialParams) error {
			return nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.EliminarHistorialClase(context.Background(), &pb.EliminarHistorialClaseRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatal("esperaba exito=true")
	}
}

func TestHistoryController_EliminarHistorialClase_Error(t *testing.T) {
	svc := &historyServiceMock{
		eliminarHistorialFn: func(p types.EliminarHistorialParams) error {
			return types.NewNotFoundError("no existe")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.EliminarHistorialClase(context.Background(), &pb.EliminarHistorialClaseRequest{
		IdUsuario: 1, IdClase: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// --- strVal ---

func TestStrVal_Nil(t *testing.T) {
	result := strVal(nil)
	if result != "" {
		t.Fatalf("esperaba '', obtuvo '%s'", result)
	}
}

func TestStrVal_ConValor(t *testing.T) {
	s := "hola"
	result := strVal(&s)
	if result != "hola" {
		t.Fatalf("esperaba 'hola', obtuvo '%s'", result)
	}
}

func TestHistoryController_RegistrarProgreso_InternalError(t *testing.T) {
	svc := &historyServiceMock{
		registrarProgresoFn: func(p types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, errors.New("db error")
		},
	}
	ctrl := NewHistoryController(svc)
	_, err := ctrl.RegistrarProgreso(context.Background(), &pb.RegistrarProgresoRequest{
		IdUsuario: 1, IdClase: 1, IdTema: 0, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestHistoryController_ConsultarHistorialUsuario_SinRegistros(t *testing.T) {
	svc := &historyServiceMock{
		consultarHistorialFn: func(p types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
			return types.ConsultarHistorialResult{
				Registros:    []types.HistorialReproduccion{},
				TotalPaginas: 0,
			}, nil
		},
	}
	ctrl := NewHistoryController(svc)
	resp, err := ctrl.ConsultarHistorialUsuario(context.Background(), &pb.ConsultarHistorialUsuarioRequest{
		IdUsuario: 1, Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Registros) != 0 {
		t.Fatalf("esperaba 0 registros, obtuvo %d", len(resp.Registros))
	}
}
