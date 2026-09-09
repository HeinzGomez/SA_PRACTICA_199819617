// HeinzGomez - Pruebas unitarias del módulo de capítulos (validación de marcas de tiempo y reglas de negocio)
package services

import (
	"database/sql"
	"testing"

	"servicio-grabaciones/types"
)

// ── Dobles de prueba (mocks) ───────────────────────────────────────────────

type capituloRepoMock struct {
	existeTiempo   bool
	capitulos      []types.Capitulo
	buscarErr      error
	capituloPorId  types.Capitulo
	creado         types.Capitulo
	crearInvocado  bool
	editarInvocado bool
}

func (m *capituloRepoMock) CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error) {
	m.crearInvocado = true
	return types.Capitulo{ID: 100, IDClase: params.IDClase, Titulo: params.Titulo, TiempoInicio: params.TiempoInicio}, nil
}

func (m *capituloRepoMock) EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error) {
	m.editarInvocado = true
	return types.Capitulo{ID: params.ID, IDClase: m.capituloPorId.IDClase, Titulo: params.Titulo, TiempoInicio: params.TiempoInicio}, nil
}

func (m *capituloRepoMock) EliminarCapitulo(idCapitulo int32) error {
	if m.buscarErr != nil {
		return m.buscarErr
	}
	return nil
}

func (m *capituloRepoMock) BuscarCapituloPorId(idCapitulo int32) (types.Capitulo, error) {
	if m.buscarErr != nil {
		return types.Capitulo{}, m.buscarErr
	}
	return m.capituloPorId, nil
}

func (m *capituloRepoMock) ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error) {
	return m.capitulos, nil
}

func (m *capituloRepoMock) ExisteTiempoEnClase(idClase int32, tiempoInicio int32, exceptoID int32) (bool, error) {
	return m.existeTiempo, nil
}

// classRepoMock implementa repositories.ClassRepository; solo BuscarClaseGrabada
// tiene comportamiento útil para estas pruebas, el resto son stubs.
type classRepoMock struct {
	duracionMin int32
	noExiste    bool
}

func (m *classRepoMock) BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error) {
	if m.noExiste {
		return types.ClaseGrabada{}, sql.ErrNoRows
	}
	return types.ClaseGrabada{ID: idClase, DuracionMin: m.duracionMin}, nil
}

func (m *classRepoMock) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *classRepoMock) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *classRepoMock) EliminarClaseGrabada(idClase int32) error { return nil }
func (m *classRepoMock) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	return types.CatalogoClasesResult{}, nil
}
func (m *classRepoMock) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	return types.BusquedaAvanzadaResult{}, nil
}
func (m *classRepoMock) ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error) {
	return nil, nil
}
func (m *classRepoMock) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) { return "", nil }
func (m *classRepoMock) CargaMasivaClases(pClasesJSON string) (string, error)     { return "", nil }

func esInvalidArgument(err error) bool {
	appErr, ok := err.(*types.AppError)
	return ok && appErr.Code == types.CodeInvalidArgument
}

// ── ValidarCapitulo (validación pura de rangos de marcas de tiempo) ─────────

func TestValidarCapitulo(t *testing.T) {
	casos := []struct {
		nombre           string
		titulo           string
		tiempoInicio     int32
		duracionSegundos int32
		esperaError      bool
	}{
		{"marca válida dentro del rango", "Introducción", 0, 5400, false},
		{"marca al final exacto de la clase", "Cierre", 5400, 5400, false},
		{"título vacío es inválido", "   ", 30, 5400, true},
		{"marca negativa es inválida", "Tema", -1, 5400, true},
		{"marca fuera de la duración es inválida", "Tema", 5401, 5400, true},
		{"sin duración conocida no acota el máximo", "Tema", 99999, 0, false},
	}

	for _, caso := range casos {
		t.Run(caso.nombre, func(t *testing.T) {
			err := ValidarCapitulo(caso.titulo, caso.tiempoInicio, caso.duracionSegundos)
			if caso.esperaError && err == nil {
				t.Fatalf("se esperaba error para %q pero no lo hubo", caso.nombre)
			}
			if !caso.esperaError && err != nil {
				t.Fatalf("no se esperaba error para %q pero se obtuvo: %v", caso.nombre, err)
			}
		})
	}
}

// ── CrearCapitulo ──────────────────────────────────────────────────────────

func TestCrearCapitulo_Exito(t *testing.T) {
	capRepo := &capituloRepoMock{existeTiempo: false}
	clsRepo := &classRepoMock{duracionMin: 90} // 5400 s

	svc := NewCapituloService(capRepo, clsRepo)
	capitulo, err := svc.CrearCapitulo(types.CrearCapituloParams{
		IDClase: 1, Titulo: "  Fundamentos  ", TiempoInicio: 750,
	})
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if !capRepo.crearInvocado {
		t.Fatal("se esperaba que el repositorio creara el capítulo")
	}
	if capitulo.Titulo != "Fundamentos" {
		t.Fatalf("el título debía normalizarse (trim), se obtuvo %q", capitulo.Titulo)
	}
}

func TestCrearCapitulo_ClaseInexistente(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{noExiste: true})
	_, err := svc.CrearCapitulo(types.CrearCapituloParams{IDClase: 99, Titulo: "X", TiempoInicio: 10})
	if err == nil {
		t.Fatal("se esperaba error de clase inexistente")
	}
	appErr, ok := err.(*types.AppError)
	if !ok || appErr.Code != types.CodeNotFound {
		t.Fatalf("se esperaba NOT_FOUND, se obtuvo %v", err)
	}
}

func TestCrearCapitulo_TiempoFueraDeRango(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{duracionMin: 10}) // 600 s
	_, err := svc.CrearCapitulo(types.CrearCapituloParams{IDClase: 1, Titulo: "X", TiempoInicio: 601})
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT por marca fuera de rango, se obtuvo %v", err)
	}
}

func TestCrearCapitulo_TiempoDuplicado(t *testing.T) {
	capRepo := &capituloRepoMock{existeTiempo: true}
	svc := NewCapituloService(capRepo, &classRepoMock{duracionMin: 90})
	_, err := svc.CrearCapitulo(types.CrearCapituloParams{IDClase: 1, Titulo: "X", TiempoInicio: 750})
	if err == nil {
		t.Fatal("se esperaba error por marca de tiempo duplicada")
	}
	appErr, ok := err.(*types.AppError)
	if !ok || appErr.Code != types.CodeAlreadyExists {
		t.Fatalf("se esperaba ALREADY_EXISTS, se obtuvo %v", err)
	}
	if capRepo.crearInvocado {
		t.Fatal("no debía intentarse crear un capítulo duplicado")
	}
}

// ── EditarCapitulo / ConsultarCapitulosClase ───────────────────────────────

func TestEditarCapitulo_NoExiste(t *testing.T) {
	capRepo := &capituloRepoMock{buscarErr: sql.ErrNoRows}
	svc := NewCapituloService(capRepo, &classRepoMock{duracionMin: 90})
	_, err := svc.EditarCapitulo(types.EditarCapituloParams{ID: 5, Titulo: "X", TiempoInicio: 30})
	appErr, ok := err.(*types.AppError)
	if !ok || appErr.Code != types.CodeNotFound {
		t.Fatalf("se esperaba NOT_FOUND, se obtuvo %v", err)
	}
}

func TestConsultarCapitulosClase_IdInvalido(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{})
	_, err := svc.ConsultarCapitulosClase(0)
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT por id de clase inválido, se obtuvo %v", err)
	}
}

// ── EliminarCapitulo ────────────────────────────────────────────────────

func TestEliminarCapitulo_Exito(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{})
	err := svc.EliminarCapitulo(1)
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
}

func TestEliminarCapitulo_IdInvalido(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{})
	err := svc.EliminarCapitulo(0)
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT, se obtuvo %v", err)
	}
}

func TestEliminarCapitulo_NoExiste(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{buscarErr: sql.ErrNoRows}, &classRepoMock{})
	err := svc.EliminarCapitulo(99)
	appErr, ok := err.(*types.AppError)
	if !ok || appErr.Code != types.CodeNotFound {
		t.Fatalf("se esperaba NOT_FOUND, se obtuvo %v", err)
	}
}

func TestEliminarCapitulo_ErrorInterno(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{buscarErr: types.NewInternalError("db falla")}, &classRepoMock{})
	err := svc.EliminarCapitulo(1)
	appErr, ok := err.(*types.AppError)
	if !ok || appErr.Code != types.CodeInternal {
		t.Fatalf("se esperaba INTERNAL, se obtuvo %v", err)
	}
}

// ── CrearCapitulo: ID clase inválido ────────────────────────────────────

func TestCrearCapitulo_ClaseIdInvalido(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{})
	_, err := svc.CrearCapitulo(types.CrearCapituloParams{IDClase: 0, Titulo: "X", TiempoInicio: 10})
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT, se obtuvo %v", err)
	}
}

// ── EditarCapitulo: ID inválido y título inválido ──────────────────────

func TestEditarCapitulo_IdInvalido(t *testing.T) {
	svc := NewCapituloService(&capituloRepoMock{}, &classRepoMock{})
	_, err := svc.EditarCapitulo(types.EditarCapituloParams{ID: 0, Titulo: "X", TiempoInicio: 30})
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT, se obtuvo %v", err)
	}
}

func TestEditarCapitulo_TituloVacio(t *testing.T) {
	capRepo := &capituloRepoMock{capituloPorId: types.Capitulo{IDClase: 1}}
	svc := NewCapituloService(capRepo, &classRepoMock{duracionMin: 90})
	_, err := svc.EditarCapitulo(types.EditarCapituloParams{ID: 1, Titulo: "   ", TiempoInicio: 30})
	if err == nil || !esInvalidArgument(err) {
		t.Fatalf("se esperaba INVALID_ARGUMENT por título vacío, se obtuvo %v", err)
	}
}

// ── ConsultarCapitulosClase: exito ─────────────────────────────────────

func TestConsultarCapitulosClase_Exito(t *testing.T) {
	caps := []types.Capitulo{{ID: 1, Titulo: "Cap 1"}}
	svc := NewCapituloService(&capituloRepoMock{capitulos: caps}, &classRepoMock{})
	result, err := svc.ConsultarCapitulosClase(1)
	if err != nil {
		t.Fatalf("no se esperaba error: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("esperaba 1, obtuvo %d", len(result))
	}
}
