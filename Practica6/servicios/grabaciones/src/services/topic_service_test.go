package services

import (
	"database/sql"
	"errors"
	"testing"

	"servicio-grabaciones/types"
)

type topicRepoMock struct {
	unidadCreada    types.Unidad
	unidadEditada   types.Unidad
	unidadEliminada error
	unidadPorId     types.Unidad
	unidadPorIdErr  error
	unidades        []types.Unidad
	unidadesErr     error
	temaCreado      types.Tema
	temaEditado     types.Tema
	temaPorId       types.Tema
	temaPorIdErr    error
	temas           []types.Tema
	temasErr        error
	totalTemas      int64
	totalTemasErr   error
	crearUnidadErr  error
	editarUnidadErr error
	crearTemaErr    error
	editarTemaErr   error
}

func (m *topicRepoMock) CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error) {
	return m.unidadCreada, m.crearUnidadErr
}
func (m *topicRepoMock) EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error) {
	return m.unidadEditada, m.editarUnidadErr
}
func (m *topicRepoMock) EliminarUnidad(idUnidad int32) error {
	return m.unidadEliminada
}
func (m *topicRepoMock) BuscarUnidadPorId(idUnidad int32) (types.Unidad, error) {
	return m.unidadPorId, m.unidadPorIdErr
}
func (m *topicRepoMock) ConsultarUnidades() ([]types.Unidad, error) {
	return m.unidades, m.unidadesErr
}
func (m *topicRepoMock) ContarTemasPorUnidad(idUnidad int32) (int64, error) {
	return m.totalTemas, m.totalTemasErr
}
func (m *topicRepoMock) CrearTema(params types.CrearTemaParams) (types.Tema, error) {
	return m.temaCreado, m.crearTemaErr
}
func (m *topicRepoMock) EditarTema(params types.EditarTemaParams) (types.Tema, error) {
	return m.temaEditado, m.editarTemaErr
}
func (m *topicRepoMock) EliminarTema(idTema int32) error { return nil }
func (m *topicRepoMock) BuscarTemaPorId(idTema int32) (types.Tema, error) {
	return m.temaPorId, m.temaPorIdErr
}
func (m *topicRepoMock) ConsultarTemas(idUnidad int32) ([]types.Tema, error) {
	return m.temas, m.temasErr
}

func TestCrearUnidad_Exito(t *testing.T) {
	repo := &topicRepoMock{unidadCreada: types.Unidad{ID: 1, Nombre: "Unidad 1"}}
	svc := NewTopicService(repo)
	result, err := svc.CrearUnidad(types.CrearUnidadParams{Nombre: "Unidad 1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestCrearUnidad_NombreVacio(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.CrearUnidad(types.CrearUnidadParams{Nombre: ""})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearUnidad_NombreSoloEspacios(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.CrearUnidad(types.CrearUnidadParams{Nombre: "   "})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearUnidad_RepoError(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{crearUnidadErr: errors.New("db error")})
	_, err := svc.CrearUnidad(types.CrearUnidadParams{Nombre: "X"})
	if !esInternal(err) {
		t.Fatalf("esperaba Internal, obtuvo: %v", err)
	}
}

func TestEditarUnidad_Exito(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}, unidadEditada: types.Unidad{ID: 1, Nombre: "Editada"}}
	svc := NewTopicService(repo)
	result, err := svc.EditarUnidad(types.EditarUnidadParams{ID: 1, Nombre: "Editada"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.Nombre != "Editada" {
		t.Fatalf("esperaba Nombre=Editada, obtuvo %s", result.Nombre)
	}
}

func TestEditarUnidad_IDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.EditarUnidad(types.EditarUnidadParams{ID: 0, Nombre: "X"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEditarUnidad_NoExiste(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{unidadPorIdErr: sql.ErrNoRows})
	_, err := svc.EditarUnidad(types.EditarUnidadParams{ID: 99, Nombre: "X"})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestEditarUnidad_NombreVacio(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}}
	svc := NewTopicService(repo)
	_, err := svc.EditarUnidad(types.EditarUnidadParams{ID: 1, Nombre: ""})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEliminarUnidad_Exito(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}, totalTemas: 0}
	svc := NewTopicService(repo)
	if err := svc.EliminarUnidad(1); err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarUnidad_IDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	if err := svc.EliminarUnidad(0); !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEliminarUnidad_NoExiste(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{unidadPorIdErr: sql.ErrNoRows})
	if err := svc.EliminarUnidad(99); !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestEliminarUnidad_ConTemasAsociados(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}, totalTemas: 3}
	svc := NewTopicService(repo)
	if err := svc.EliminarUnidad(1); !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestConsultarUnidades_Exito(t *testing.T) {
	repo := &topicRepoMock{unidades: []types.Unidad{{ID: 1}, {ID: 2}}}
	svc := NewTopicService(repo)
	result, err := svc.ConsultarUnidades()
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("esperaba 2 unidades, obtuvo %d", len(result))
	}
}

func TestConsultarUnidades_Error(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{unidadesErr: errors.New("db")})
	_, err := svc.ConsultarUnidades()
	if !esInternal(err) {
		t.Fatalf("esperaba Internal, obtuvo: %v", err)
	}
}

func TestCrearTema_Exito(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}, temaCreado: types.Tema{ID: 1, Nombre: "Tema 1"}}
	svc := NewTopicService(repo)
	result, err := svc.CrearTema(types.CrearTemaParams{UnidadID: 1, Nombre: "Tema 1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.ID != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", result.ID)
	}
}

func TestCrearTema_UnidadIDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.CrearTema(types.CrearTemaParams{UnidadID: 0, Nombre: "X"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestCrearTema_UnidadNoExiste(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{unidadPorIdErr: sql.ErrNoRows})
	_, err := svc.CrearTema(types.CrearTemaParams{UnidadID: 99, Nombre: "X"})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestCrearTema_NombreVacio(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}}
	svc := NewTopicService(repo)
	_, err := svc.CrearTema(types.CrearTemaParams{UnidadID: 1, Nombre: ""})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEditarTema_Exito(t *testing.T) {
	repo := &topicRepoMock{
		unidadPorId:  types.Unidad{ID: 1},
		temaPorId:    types.Tema{ID: 1},
		temaEditado:  types.Tema{ID: 1, Nombre: "Editado"},
	}
	svc := NewTopicService(repo)
	result, err := svc.EditarTema(types.EditarTemaParams{ID: 1, UnidadID: 1, Nombre: "Editado"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.Nombre != "Editado" {
		t.Fatalf("esperaba Nombre=Editado, obtuvo %s", result.Nombre)
	}
}

func TestEditarTema_IDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.EditarTema(types.EditarTemaParams{ID: 0, UnidadID: 1, Nombre: "X"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEditarTema_UnidadIDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.EditarTema(types.EditarTemaParams{ID: 1, UnidadID: 0, Nombre: "X"})
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEditarTema_NoExiste(t *testing.T) {
	repo := &topicRepoMock{unidadPorId: types.Unidad{ID: 1}, temaPorIdErr: sql.ErrNoRows}
	svc := NewTopicService(repo)
	_, err := svc.EditarTema(types.EditarTemaParams{ID: 99, UnidadID: 1, Nombre: "X"})
	if !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestEliminarTema_Exito(t *testing.T) {
	repo := &topicRepoMock{temaPorId: types.Tema{ID: 1}}
	svc := NewTopicService(repo)
	if err := svc.EliminarTema(1); err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarTema_IDCero(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	if err := svc.EliminarTema(0); !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func TestEliminarTema_NoExiste(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{temaPorIdErr: sql.ErrNoRows})
	if err := svc.EliminarTema(99); !esNotFound(err) {
		t.Fatalf("esperaba NotFound, obtuvo: %v", err)
	}
}

func TestConsultarTemas_Exito(t *testing.T) {
	repo := &topicRepoMock{temas: []types.Tema{{ID: 1}}}
	svc := NewTopicService(repo)
	result, err := svc.ConsultarTemas(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("esperaba 1 tema, obtuvo %d", len(result))
	}
}

func TestConsultarTemas_IDNegativo(t *testing.T) {
	svc := NewTopicService(&topicRepoMock{})
	_, err := svc.ConsultarTemas(-1)
	if !esInvalidArgument(err) {
		t.Fatalf("esperaba InvalidArgument, obtuvo: %v", err)
	}
}

func esNotFound(err error) bool {
	appErr, ok := err.(*types.AppError)
	return ok && appErr.Code == types.CodeNotFound
}

func esInternal(err error) bool {
	appErr, ok := err.(*types.AppError)
	return ok && appErr.Code == types.CodeInternal
}

func esAlreadyExists(err error) bool {
	appErr, ok := err.(*types.AppError)
	return ok && appErr.Code == types.CodeAlreadyExists
}


