package services

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"

	"servicio_recursos/repositories"
	"servicio_recursos/types"
)

// ─── Mock del repositorio ────────────────────────────────

type mockForumRepository struct {
	consultarDudasClaseFn func(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error)
	crearDudaFn           func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error)
	crearRespuestaFn      func(idDuda, idUsuario int32, respuesta string) (int32, error)
	marcarRespuestaFn     func(idRespuesta, idUsuario int32) error
}

var _ repositories.ForumRepository = (*mockForumRepository)(nil)

func (m *mockForumRepository) ConsultarDudasClase(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
	if m.consultarDudasClaseFn != nil {
		return m.consultarDudasClaseFn(idClase, pagina, porPagina)
	}
	return nil, 0, nil
}
func (m *mockForumRepository) CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
	if m.crearDudaFn != nil {
		return m.crearDudaFn(idClase, idUsuario, duda, segundo)
	}
	return 1, nil
}
func (m *mockForumRepository) CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error) {
	if m.crearRespuestaFn != nil {
		return m.crearRespuestaFn(idDuda, idUsuario, respuesta)
	}
	return 1, nil
}
func (m *mockForumRepository) MarcarRespuesta(idRespuesta, idUsuario int32) error {
	if m.marcarRespuestaFn != nil {
		return m.marcarRespuestaFn(idRespuesta, idUsuario)
	}
	return nil
}

// ─── ConsultarDudasClase ─────────────────────────────────

func TestConsultarDudasClase_Exito(t *testing.T) {
	repo := &mockForumRepository{
		consultarDudasClaseFn: func(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
			if idClase != 10 || pagina != 1 || porPagina != 10 {
				t.Errorf("parámetros inesperados: %d %d %d", idClase, pagina, porPagina)
			}
			return []types.DudaInfo{
				{IDDudas: 1, IDClase: 10, IDUsuario: 20, Duda: "¿Qué es?", Segundo: int32Ptr(30)},
			}, 2, nil
		},
	}
	svc := NewForumService(repo)
	dudas, totalPaginas, err := svc.ConsultarDudasClase(10, 1)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if totalPaginas != 2 {
		t.Errorf("esperaba 2 paginas, obtuvo %d", totalPaginas)
	}
	if len(dudas) != 1 {
		t.Errorf("esperaba 1 duda, obtuvo %d", len(dudas))
	}
}

func TestConsultarDudasClase_IDClaseInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, _, err := svc.ConsultarDudasClase(0, 1)
	if err == nil {
		t.Fatal("esperaba error por IDClase inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarDudasClase_PaginaDefault(t *testing.T) {
	repo := &mockForumRepository{
		consultarDudasClaseFn: func(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
			if pagina != 1 {
				t.Errorf("esperaba pagina=1 (default), obtuvo %d", pagina)
			}
			return nil, 0, nil
		},
	}
	svc := NewForumService(repo)
	svc.ConsultarDudasClase(10, -1)
}

func int32Ptr(v int32) *int32 {
	return &v
}

func TestConsultarDudasClase_ErrorNoRows(t *testing.T) {
	repo := &mockForumRepository{
		consultarDudasClaseFn: func(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
			return nil, 0, sql.ErrNoRows
		},
	}
	svc := NewForumService(repo)
	dudas, totalPaginas, err := svc.ConsultarDudasClase(10, 1)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if totalPaginas != 0 {
		t.Errorf("esperaba 0 paginas, obtuvo %d", totalPaginas)
	}
	if len(dudas) != 0 {
		t.Errorf("esperaba 0 dudas, obtuvo %d", len(dudas))
	}
}

func TestConsultarDudasClase_ErrorInterno(t *testing.T) {
	repo := &mockForumRepository{
		consultarDudasClaseFn: func(idClase, pagina int32, porPagina int) ([]types.DudaInfo, int32, error) {
			return nil, 0, fmt.Errorf("db error")
		},
	}
	svc := NewForumService(repo)
	_, _, err := svc.ConsultarDudasClase(10, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── CrearDuda ───────────────────────────────────────────

func TestCrearDuda_Exito(t *testing.T) {
	repo := &mockForumRepository{
		crearDudaFn: func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
			if idClase != 10 || idUsuario != 20 || duda != "Mi duda" {
				t.Errorf("parámetros inesperados")
			}
			return 5, nil
		},
	}
	svc := NewForumService(repo)
	id, err := svc.CrearDuda(10, 20, "Mi duda", int32Ptr(60))
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 5 {
		t.Fatalf("esperaba id=5, obtuvo %d", id)
	}
}

func TestCrearDuda_IDClaseInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearDuda(0, 1, "duda", nil)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearDuda_IDUsuarioInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearDuda(10, 0, "duda", nil)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearDuda_DudaVacia(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearDuda(10, 20, "", nil)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearDuda_SegundoNegativo(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	neg := int32(-1)
	_, err := svc.CrearDuda(10, 20, "duda", &neg)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearDuda_SegundoNil(t *testing.T) {
	repo := &mockForumRepository{
		crearDudaFn: func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
			return 10, nil
		},
	}
	svc := NewForumService(repo)
	id, err := svc.CrearDuda(10, 20, "duda", nil)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 10 {
		t.Errorf("esperaba id=10, obtuvo %d", id)
	}
}

func TestCrearDuda_ErrorRepositorio(t *testing.T) {
	repo := &mockForumRepository{
		crearDudaFn: func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
			return 0, fmt.Errorf("db error")
		},
	}
	svc := NewForumService(repo)
	_, err := svc.CrearDuda(10, 20, "duda", nil)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── CrearRespuesta ──────────────────────────────────────

func TestCrearRespuesta_Exito(t *testing.T) {
	repo := &mockForumRepository{
		crearRespuestaFn: func(idDuda, idUsuario int32, respuesta string) (int32, error) {
			if idDuda != 1 || idUsuario != 20 || respuesta != "Mi respuesta" {
				t.Errorf("parámetros inesperados")
			}
			return 8, nil
		},
	}
	svc := NewForumService(repo)
	id, err := svc.CrearRespuesta(1, 20, "Mi respuesta")
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 8 {
		t.Fatalf("esperaba id=8, obtuvo %d", id)
	}
}

func TestCrearRespuesta_IDDudaInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearRespuesta(0, 1, "respuesta")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearRespuesta_IDUsuarioInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearRespuesta(1, 0, "respuesta")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearRespuesta_RespuestaVacia(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	_, err := svc.CrearRespuesta(1, 20, "")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearRespuesta_ErrorRepositorio(t *testing.T) {
	repo := &mockForumRepository{
		crearRespuestaFn: func(idDuda, idUsuario int32, respuesta string) (int32, error) {
			return 0, fmt.Errorf("db error")
		},
	}
	svc := NewForumService(repo)
	_, err := svc.CrearRespuesta(1, 20, "respuesta")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── MarcarRespuesta ─────────────────────────────────────

func TestMarcarRespuesta_Exito(t *testing.T) {
	repo := &mockForumRepository{
		marcarRespuestaFn: func(idRespuesta, idUsuario int32) error {
			if idRespuesta != 1 || idUsuario != 20 {
				t.Errorf("parámetros inesperados")
			}
			return nil
		},
	}
	svc := NewForumService(repo)
	err := svc.MarcarRespuesta(1, 20)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestMarcarRespuesta_IDRespuestaInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	err := svc.MarcarRespuesta(0, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestMarcarRespuesta_IDUsuarioInvalido(t *testing.T) {
	svc := NewForumService(&mockForumRepository{})
	err := svc.MarcarRespuesta(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestMarcarRespuesta_NoEncontrado(t *testing.T) {
	repo := &mockForumRepository{
		marcarRespuestaFn: func(idRespuesta, idUsuario int32) error {
			return sql.ErrNoRows
		},
	}
	svc := NewForumService(repo)
	err := svc.MarcarRespuesta(1, 1)
	if err == nil {
		t.Fatal("esperaba error NOT_FOUND")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestMarcarRespuesta_ErrorInterno(t *testing.T) {
	repo := &mockForumRepository{
		marcarRespuestaFn: func(idRespuesta, idUsuario int32) error {
			return fmt.Errorf("db error")
		},
	}
	svc := NewForumService(repo)
	err := svc.MarcarRespuesta(1, 1)
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}
