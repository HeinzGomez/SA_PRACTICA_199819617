package services

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"

	"servicio_recursos/repositories"
	"servicio_recursos/types"
)

// ─── Mock del repositorio de apuntes ─────────────────────

type mockNotesRepository struct {
	consultarApunteFn      func(idClase, idUsuario int32) (types.ApunteInfo, error)
	crearApunteFn          func(idClase, idUsuario int32, titulo, contenido string) (int32, error)
	actualizarApunteFn     func(idApunte int32, titulo, contenido string) error
	agregarMarcadorFn      func(idApunte int32, segundo int32, texto string) (int32, error)
	eliminarMarcadorFn     func(idMarcador int32) error
}

var _ repositories.NotesRepository = (*mockNotesRepository)(nil)

func (m *mockNotesRepository) ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error) {
	if m.consultarApunteFn != nil {
		return m.consultarApunteFn(idClase, idUsuario)
	}
	return types.ApunteInfo{}, nil
}
func (m *mockNotesRepository) CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
	if m.crearApunteFn != nil {
		return m.crearApunteFn(idClase, idUsuario, titulo, contenido)
	}
	return 1, nil
}
func (m *mockNotesRepository) ActualizarApunte(idApunte int32, titulo, contenido string) error {
	if m.actualizarApunteFn != nil {
		return m.actualizarApunteFn(idApunte, titulo, contenido)
	}
	return nil
}
func (m *mockNotesRepository) AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error) {
	if m.agregarMarcadorFn != nil {
		return m.agregarMarcadorFn(idApunte, segundo, texto)
	}
	return 1, nil
}
func (m *mockNotesRepository) EliminarMarcadorTiempo(idMarcador int32) error {
	if m.eliminarMarcadorFn != nil {
		return m.eliminarMarcadorFn(idMarcador)
	}
	return nil
}

// ─── ConsultarApunte ─────────────────────────────────────

func TestConsultarApunte_Exito(t *testing.T) {
	repo := &mockNotesRepository{
		consultarApunteFn: func(idClase, idUsuario int32) (types.ApunteInfo, error) {
			if idClase != 5 || idUsuario != 10 {
				t.Errorf("esperaba idClase=5 idUsuario=10, obtuvo %d %d", idClase, idUsuario)
			}
			return types.ApunteInfo{
				IDApunte:  1,
				IDClase:   5,
				IDUsuario: 10,
				Titulo:    "Notas de POO",
			}, nil
		},
	}
	svc := NewNotesService(repo)
	apunte, err := svc.ConsultarApunte(5, 10)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if apunte.Titulo != "Notas de POO" {
		t.Errorf("esperaba titulo 'Notas de POO', obtuvo '%s'", apunte.Titulo)
	}
}

func TestConsultarApunte_IDClaseInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.ConsultarApunte(0, 10)
	if err == nil {
		t.Fatal("esperaba error por idClase inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarApunte_IDUsuarioInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.ConsultarApunte(5, -1)
	if err == nil {
		t.Fatal("esperaba error por idUsuario inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarApunte_NoEncontrado(t *testing.T) {
	repo := &mockNotesRepository{
		consultarApunteFn: func(idClase, idUsuario int32) (types.ApunteInfo, error) {
			return types.ApunteInfo{}, sql.ErrNoRows
		},
	}
	svc := NewNotesService(repo)
	_, err := svc.ConsultarApunte(5, 10)
	if err == nil {
		t.Fatal("esperaba error NOT_FOUND")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestConsultarApunte_ErrorInterno(t *testing.T) {
	repo := &mockNotesRepository{
		consultarApunteFn: func(idClase, idUsuario int32) (types.ApunteInfo, error) {
			return types.ApunteInfo{}, fmt.Errorf("db connection failed")
		},
	}
	svc := NewNotesService(repo)
	_, err := svc.ConsultarApunte(5, 10)
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── CrearApunte ─────────────────────────────────────────

func TestCrearApunte_Exito(t *testing.T) {
	repo := &mockNotesRepository{
		crearApunteFn: func(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
			if titulo != "Mi nota" {
				t.Errorf("esperaba titulo 'Mi nota', obtuvo '%s'", titulo)
			}
			return 99, nil
		},
	}
	svc := NewNotesService(repo)
	id, err := svc.CrearApunte(1, 2, "Mi nota", "# Contenido")
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 99 {
		t.Fatalf("esperaba id=99, obtuvo %d", id)
	}
}

func TestCrearApunte_IDClaseInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.CrearApunte(0, 2, "titulo", "contenido")
	if err == nil {
		t.Fatal("esperaba error por idClase inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearApunte_IDUsuarioInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.CrearApunte(1, 0, "titulo", "contenido")
	if err == nil {
		t.Fatal("esperaba error por idUsuario inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearApunte_TituloVacio(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.CrearApunte(1, 2, "", "contenido")
	if err == nil {
		t.Fatal("esperaba error por título vacío")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearApunte_ErrorRepositorio(t *testing.T) {
	repo := &mockNotesRepository{
		crearApunteFn: func(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
			return 0, fmt.Errorf("duplicate key")
		},
	}
	svc := NewNotesService(repo)
	_, err := svc.CrearApunte(1, 2, "titulo", "contenido")
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ActualizarApunte ────────────────────────────────────

func TestActualizarApunte_Exito(t *testing.T) {
	repo := &mockNotesRepository{
		actualizarApunteFn: func(idApunte int32, titulo, contenido string) error {
			if idApunte != 7 {
				t.Errorf("esperaba idApunte=7, obtuvo %d", idApunte)
			}
			return nil
		},
	}
	svc := NewNotesService(repo)
	err := svc.ActualizarApunte(7, "Nuevo título", "Nuevo contenido")
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestActualizarApunte_IDInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	err := svc.ActualizarApunte(0, "titulo", "contenido")
	if err == nil {
		t.Fatal("esperaba error por idApunte inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestActualizarApunte_TituloVacio(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	err := svc.ActualizarApunte(1, "", "contenido")
	if err == nil {
		t.Fatal("esperaba error por título vacío")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestActualizarApunte_ErrorRepositorio(t *testing.T) {
	repo := &mockNotesRepository{
		actualizarApunteFn: func(idApunte int32, titulo, contenido string) error {
			return fmt.Errorf("update failed")
		},
	}
	svc := NewNotesService(repo)
	err := svc.ActualizarApunte(1, "titulo", "contenido")
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── AgregarMarcadorTiempo ────────────────────────────────

func TestAgregarMarcadorTiempo_Exito(t *testing.T) {
	repo := &mockNotesRepository{
		agregarMarcadorFn: func(idApunte int32, segundo int32, texto string) (int32, error) {
			if idApunte != 3 || segundo != 120 || texto != "Punto importante" {
				t.Errorf("parámetros inesperados: %d %d %s", idApunte, segundo, texto)
			}
			return 55, nil
		},
	}
	svc := NewNotesService(repo)
	id, err := svc.AgregarMarcadorTiempo(3, 120, "Punto importante")
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 55 {
		t.Fatalf("esperaba id=55, obtuvo %d", id)
	}
}

func TestAgregarMarcadorTiempo_IDApunteInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.AgregarMarcadorTiempo(0, 10, "texto")
	if err == nil {
		t.Fatal("esperaba error por idApunte inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestAgregarMarcadorTiempo_SegundoNegativo(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	_, err := svc.AgregarMarcadorTiempo(1, -5, "texto")
	if err == nil {
		t.Fatal("esperaba error por segundo negativo")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestAgregarMarcadorTiempo_ErrorRepositorio(t *testing.T) {
	repo := &mockNotesRepository{
		agregarMarcadorFn: func(idApunte int32, segundo int32, texto string) (int32, error) {
			return 0, fmt.Errorf("insert failed")
		},
	}
	svc := NewNotesService(repo)
	_, err := svc.AgregarMarcadorTiempo(1, 10, "texto")
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── EliminarMarcadorTiempo ──────────────────────────────

func TestEliminarMarcadorTiempo_Exito(t *testing.T) {
	repo := &mockNotesRepository{
		eliminarMarcadorFn: func(idMarcador int32) error {
			if idMarcador != 10 {
				t.Errorf("esperaba idMarcador=10, obtuvo %d", idMarcador)
			}
			return nil
		},
	}
	svc := NewNotesService(repo)
	err := svc.EliminarMarcadorTiempo(10)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestEliminarMarcadorTiempo_IDInvalido(t *testing.T) {
	svc := NewNotesService(&mockNotesRepository{})
	err := svc.EliminarMarcadorTiempo(0)
	if err == nil {
		t.Fatal("esperaba error por idMarcador inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestEliminarMarcadorTiempo_ErrorRepositorio(t *testing.T) {
	repo := &mockNotesRepository{
		eliminarMarcadorFn: func(idMarcador int32) error {
			return fmt.Errorf("delete failed")
		},
	}
	svc := NewNotesService(repo)
	err := svc.EliminarMarcadorTiempo(1)
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}
