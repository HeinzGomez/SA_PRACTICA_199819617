package controller

import (
	"context"
	"testing"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/types"
)

type topicServiceMock struct {
	unidadCreada types.Unidad
	unidadEditada types.Unidad
	unidades     []types.Unidad
	temaCreado    types.Tema
	temaEditado   types.Tema
	temas         []types.Tema
	err           error
}

func (m *topicServiceMock) CrearUnidad(params types.CrearUnidadParams) (types.Unidad, error) {
	return m.unidadCreada, m.err
}
func (m *topicServiceMock) EditarUnidad(params types.EditarUnidadParams) (types.Unidad, error) {
	return m.unidadEditada, m.err
}
func (m *topicServiceMock) EliminarUnidad(idUnidad int32) error { return m.err }
func (m *topicServiceMock) ConsultarUnidades() ([]types.Unidad, error) {
	return m.unidades, m.err
}
func (m *topicServiceMock) CrearTema(params types.CrearTemaParams) (types.Tema, error) {
	return m.temaCreado, m.err
}
func (m *topicServiceMock) EditarTema(params types.EditarTemaParams) (types.Tema, error) {
	return m.temaEditado, m.err
}
func (m *topicServiceMock) EliminarTema(idTema int32) error { return m.err }
func (m *topicServiceMock) ConsultarTemas(idUnidad int32) ([]types.Tema, error) {
	return m.temas, m.err
}

func TestTopicController_CrearUnidad_Exito(t *testing.T) {
	svc := &topicServiceMock{unidadCreada: types.Unidad{ID: 1, Nombre: "U1"}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.CrearUnidad(context.Background(), &pb.CrearUnidadRequest{Nombre: "U1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_CrearUnidad_Error(t *testing.T) {
	svc := &topicServiceMock{err: types.NewInvalidArgumentError("nombre obligatorio")}
	ctrl := NewTopicController(svc)
	_, err := ctrl.CrearUnidad(context.Background(), &pb.CrearUnidadRequest{Nombre: ""})
	if err == nil {
		t.Fatalf("esperaba error")
	}
}

func TestTopicController_EditarUnidad_Exito(t *testing.T) {
	svc := &topicServiceMock{unidadEditada: types.Unidad{ID: 1, Nombre: "Editada"}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.EditarUnidad(context.Background(), &pb.EditarUnidadRequest{IdUnidad: 1, Nombre: "Editada"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_EliminarUnidad_Exito(t *testing.T) {
	svc := &topicServiceMock{}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.EliminarUnidad(context.Background(), &pb.EliminarUnidadRequest{IdUnidad: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_ConsultarUnidades_Exito(t *testing.T) {
	svc := &topicServiceMock{unidades: []types.Unidad{{ID: 1}, {ID: 2}}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.ConsultarUnidades(context.Background(), &pb.ConsultarUnidadesRequest{})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Unidades) != 2 {
		t.Fatalf("esperaba 2 unidades, obtuvo %d", len(resp.Unidades))
	}
}

func TestTopicController_CrearTema_Exito(t *testing.T) {
	svc := &topicServiceMock{temaCreado: types.Tema{ID: 1, Nombre: "T1"}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.CrearTema(context.Background(), &pb.CrearTemaRequest{IdUnidad: 1, Nombre: "T1"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_EditarTema_Exito(t *testing.T) {
	svc := &topicServiceMock{temaEditado: types.Tema{ID: 1, Nombre: "Editado"}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.EditarTema(context.Background(), &pb.EditarTemaRequest{IdTema: 1, IdUnidad: 1, Nombre: "Editado"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_EliminarTema_Exito(t *testing.T) {
	svc := &topicServiceMock{}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.EliminarTema(context.Background(), &pb.EliminarTemaRequest{IdTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestTopicController_ConsultarTemas_Exito(t *testing.T) {
	svc := &topicServiceMock{temas: []types.Tema{{ID: 1}}}
	ctrl := NewTopicController(svc)
	resp, err := ctrl.ConsultarTemas(context.Background(), &pb.ConsultarTemasRequest{IdUnidad: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Temas) != 1 {
		t.Fatalf("esperaba 1 tema, obtuvo %d", len(resp.Temas))
	}
}
