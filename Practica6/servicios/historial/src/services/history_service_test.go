package services

import (
	"database/sql"
	"errors"
	"testing"

	"servicio-historial/repositories"
	"servicio-historial/types"
)

type historyRepoMock struct {
	registrarProgresoFn       func(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error)
	actualizarCheckpointFn    func(params types.ActualizarCheckpointParams) (types.CheckpointClase, error)
	marcarClaseCompletadaFn   func(idUsuario, idClase int32) (types.HistorialReproduccion, error)
	obtenerCheckpointClaseFn  func(idUsuario, idClase int32) (types.CheckpointClase, error)
	consultarHistorialFn      func(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error)
	consultarEstadisticasFn   func(idUsuario int32) (types.EstadisticasUsuario, error)
	eliminarHistorialClaseFn  func(params types.EliminarHistorialParams) error
}

var _ repositories.HistoryRepository = (*historyRepoMock)(nil)

func (m *historyRepoMock) RegistrarProgreso(params types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
	if m.registrarProgresoFn != nil {
		return m.registrarProgresoFn(params)
	}
	return types.HistorialReproduccion{}, nil
}

func (m *historyRepoMock) ActualizarCheckpoint(params types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
	if m.actualizarCheckpointFn != nil {
		return m.actualizarCheckpointFn(params)
	}
	return types.CheckpointClase{}, nil
}

func (m *historyRepoMock) MarcarClaseCompletada(idUsuario, idClase int32) (types.HistorialReproduccion, error) {
	if m.marcarClaseCompletadaFn != nil {
		return m.marcarClaseCompletadaFn(idUsuario, idClase)
	}
	return types.HistorialReproduccion{}, nil
}

func (m *historyRepoMock) ObtenerCheckpointClase(idUsuario, idClase int32) (types.CheckpointClase, error) {
	if m.obtenerCheckpointClaseFn != nil {
		return m.obtenerCheckpointClaseFn(idUsuario, idClase)
	}
	return types.CheckpointClase{}, nil
}

func (m *historyRepoMock) ConsultarHistorialUsuario(params types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
	if m.consultarHistorialFn != nil {
		return m.consultarHistorialFn(params)
	}
	return types.ConsultarHistorialResult{}, nil
}

func (m *historyRepoMock) ConsultarEstadisticasUsuario(idUsuario int32) (types.EstadisticasUsuario, error) {
	if m.consultarEstadisticasFn != nil {
		return m.consultarEstadisticasFn(idUsuario)
	}
	return types.EstadisticasUsuario{}, nil
}

func (m *historyRepoMock) EliminarHistorialClase(params types.EliminarHistorialParams) error {
	if m.eliminarHistorialClaseFn != nil {
		return m.eliminarHistorialClaseFn(params)
	}
	return nil
}

// RegistrarProgreso
func TestRegistrarProgreso_Exito(t *testing.T) {
	repo := &historyRepoMock{
		registrarProgresoFn: func(p types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{IDHistorial: 1, IDUsuario: p.IDUsuario}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 1, MinutoActual: 10, SegundoActual: 30, DuracionTotal: 120})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDHistorial != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.IDHistorial)
	}
}

func TestRegistrarProgreso_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 0, IDClase: 1, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_IDClaseInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 0, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_IDTemaNegativo(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: -1, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_MinutoActualNegativo(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: -1, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_SegundoActualInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 60, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_DuracionTotalInvalida(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestRegistrarProgreso_RepoError(t *testing.T) {
	repo := &historyRepoMock{
		registrarProgresoFn: func(p types.RegistrarProgresoParams) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, errors.New("db error")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.RegistrarProgreso(types.RegistrarProgresoParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 0, DuracionTotal: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ActualizarCheckpoint
func TestActualizarCheckpoint_Exito(t *testing.T) {
	repo := &historyRepoMock{
		actualizarCheckpointFn: func(p types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
			return types.CheckpointClase{IDTema: p.IDTema, MinutoActual: p.MinutoActual}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 1, MinutoActual: 10, SegundoActual: 30})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDTema != 1 {
		t.Fatalf("esperaba IDTema=1, obtuvo %d", result.IDTema)
	}
}

func TestActualizarCheckpoint_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_IDClaseInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_IDTemaNegativo(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: -1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_MinutoActualNegativo(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: -1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_SegundoActualInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 60})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_RepoError(t *testing.T) {
	repo := &historyRepoMock{
		actualizarCheckpointFn: func(p types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, errors.New("db error")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestActualizarCheckpoint_NotFound(t *testing.T) {
	repo := &historyRepoMock{
		actualizarCheckpointFn: func(p types.ActualizarCheckpointParams) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, sql.ErrNoRows
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ActualizarCheckpoint(types.ActualizarCheckpointParams{IDUsuario: 1, IDClase: 1, IDTema: 0, MinutoActual: 0, SegundoActual: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// MarcarClaseCompletada
func TestMarcarClaseCompletada_Exito(t *testing.T) {
	repo := &historyRepoMock{
		marcarClaseCompletadaFn: func(idU, idC int32) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{IDUsuario: idU, IDClase: idC, Completada: true}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.MarcarClaseCompletada(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !result.Completada {
		t.Fatal("esperaba completada=true")
	}
}

func TestMarcarClaseCompletada_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.MarcarClaseCompletada(0, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestMarcarClaseCompletada_IDClaseInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.MarcarClaseCompletada(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestMarcarClaseCompletada_NotFound(t *testing.T) {
	repo := &historyRepoMock{
		marcarClaseCompletadaFn: func(idU, idC int32) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, sql.ErrNoRows
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.MarcarClaseCompletada(1, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestMarcarClaseCompletada_InternalError(t *testing.T) {
	repo := &historyRepoMock{
		marcarClaseCompletadaFn: func(idU, idC int32) (types.HistorialReproduccion, error) {
			return types.HistorialReproduccion{}, errors.New("db fail")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.MarcarClaseCompletada(1, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ObtenerCheckpointClase
func TestObtenerCheckpointClase_Exito(t *testing.T) {
	repo := &historyRepoMock{
		obtenerCheckpointClaseFn: func(idU, idC int32) (types.CheckpointClase, error) {
			return types.CheckpointClase{IDTema: 1, MinutoActual: 10}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.ObtenerCheckpointClase(1, 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.IDTema != 1 {
		t.Fatalf("esperaba IDTema=1, obtuvo %d", result.IDTema)
	}
}

func TestObtenerCheckpointClase_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ObtenerCheckpointClase(0, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestObtenerCheckpointClase_IDClaseInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ObtenerCheckpointClase(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestObtenerCheckpointClase_NotFound(t *testing.T) {
	repo := &historyRepoMock{
		obtenerCheckpointClaseFn: func(idU, idC int32) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, sql.ErrNoRows
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ObtenerCheckpointClase(1, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestObtenerCheckpointClase_InternalError(t *testing.T) {
	repo := &historyRepoMock{
		obtenerCheckpointClaseFn: func(idU, idC int32) (types.CheckpointClase, error) {
			return types.CheckpointClase{}, errors.New("db fail")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ObtenerCheckpointClase(1, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ConsultarHistorialUsuario
func TestConsultarHistorialUsuario_Exito(t *testing.T) {
	repo := &historyRepoMock{
		consultarHistorialFn: func(p types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
			return types.ConsultarHistorialResult{
				Registros:    []types.HistorialReproduccion{{IDHistorial: 1}},
				TotalPaginas: 1,
			}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Registros) != 1 {
		t.Fatalf("esperaba 1 registro, obtuvo %d", len(result.Registros))
	}
}

func TestConsultarHistorialUsuario_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 0, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarHistorialUsuario_PaginaInvalida(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarHistorialUsuario_RepoError(t *testing.T) {
	repo := &historyRepoMock{
		consultarHistorialFn: func(p types.ConsultarHistorialParams) (types.ConsultarHistorialResult, error) {
			return types.ConsultarHistorialResult{}, errors.New("db error")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ConsultarHistorialUsuario(types.ConsultarHistorialParams{IDUsuario: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ConsultarEstadisticasUsuario
func TestConsultarEstadisticasUsuario_Exito(t *testing.T) {
	repo := &historyRepoMock{
		consultarEstadisticasFn: func(idU int32) (types.EstadisticasUsuario, error) {
			return types.EstadisticasUsuario{TotalClases: 10, ClasesCompletadas: 5}, nil
		},
	}
	svc := NewHistoryService(repo)
	result, err := svc.ConsultarEstadisticasUsuario(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalClases != 10 {
		t.Fatalf("esperaba 10, obtuvo %d", result.TotalClases)
	}
}

func TestConsultarEstadisticasUsuario_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	_, err := svc.ConsultarEstadisticasUsuario(0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarEstadisticasUsuario_RepoError(t *testing.T) {
	repo := &historyRepoMock{
		consultarEstadisticasFn: func(idU int32) (types.EstadisticasUsuario, error) {
			return types.EstadisticasUsuario{}, errors.New("db error")
		},
	}
	svc := NewHistoryService(repo)
	_, err := svc.ConsultarEstadisticasUsuario(1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// EliminarHistorialClase
func TestEliminarHistorialClase_Exito(t *testing.T) {
	repo := &historyRepoMock{
		eliminarHistorialClaseFn: func(p types.EliminarHistorialParams) error {
			return nil
		},
	}
	svc := NewHistoryService(repo)
	err := svc.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarHistorialClase_IDUsuarioInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	err := svc.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 0, IDClase: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarHistorialClase_IDClaseInvalido(t *testing.T) {
	svc := NewHistoryService(&historyRepoMock{})
	err := svc.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarHistorialClase_NotFound(t *testing.T) {
	repo := &historyRepoMock{
		eliminarHistorialClaseFn: func(p types.EliminarHistorialParams) error {
			return sql.ErrNoRows
		},
	}
	svc := NewHistoryService(repo)
	err := svc.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarHistorialClase_InternalError(t *testing.T) {
	repo := &historyRepoMock{
		eliminarHistorialClaseFn: func(p types.EliminarHistorialParams) error {
			return errors.New("db fail")
		},
	}
	svc := NewHistoryService(repo)
	err := svc.EliminarHistorialClase(types.EliminarHistorialParams{IDUsuario: 1, IDClase: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}
