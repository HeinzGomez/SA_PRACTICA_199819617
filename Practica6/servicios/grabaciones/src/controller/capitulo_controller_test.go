package controller

import (
	"context"
	"testing"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/types"
)

type capituloSvcForController struct {
	capituloCreado  types.Capitulo
	capituloEditado types.Capitulo
	capitulos       []types.Capitulo
	err             error
}

func (m *capituloSvcForController) CrearCapitulo(params types.CrearCapituloParams) (types.Capitulo, error) {
	return m.capituloCreado, m.err
}
func (m *capituloSvcForController) EditarCapitulo(params types.EditarCapituloParams) (types.Capitulo, error) {
	return m.capituloEditado, m.err
}
func (m *capituloSvcForController) EliminarCapitulo(idCapitulo int32) error { return m.err }
func (m *capituloSvcForController) ConsultarCapitulosClase(idClase int32) ([]types.Capitulo, error) {
	return m.capitulos, m.err
}

func TestCapituloController_Crear_Exito(t *testing.T) {
	svc := &capituloSvcForController{capituloCreado: types.Capitulo{ID: 1, Titulo: "Intro"}}
	ctrl := NewCapituloController(svc)
	resp, err := ctrl.CrearCapitulo(context.Background(), &pb.CrearCapituloRequest{IdClase: 1, Titulo: "Intro", TiempoInicio: 0})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestCapituloController_Editar_Exito(t *testing.T) {
	svc := &capituloSvcForController{capituloEditado: types.Capitulo{ID: 1, Titulo: "Editado"}}
	ctrl := NewCapituloController(svc)
	resp, err := ctrl.EditarCapitulo(context.Background(), &pb.EditarCapituloRequest{IdCapitulo: 1, Titulo: "Editado", TiempoInicio: 0})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestCapituloController_Eliminar_Exito(t *testing.T) {
	svc := &capituloSvcForController{}
	ctrl := NewCapituloController(svc)
	resp, err := ctrl.EliminarCapitulo(context.Background(), &pb.EliminarCapituloRequest{IdCapitulo: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestCapituloController_Consultar_Exito(t *testing.T) {
	svc := &capituloSvcForController{capitulos: []types.Capitulo{{ID: 1}, {ID: 2}}}
	ctrl := NewCapituloController(svc)
	resp, err := ctrl.ConsultarCapitulosClase(context.Background(), &pb.ConsultarCapitulosClaseRequest{IdClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Capitulos) != 2 {
		t.Fatalf("esperaba 2 capitulos, obtuvo %d", len(resp.Capitulos))
	}
}

func TestCapituloController_Crear_Error(t *testing.T) {
	svc := &capituloSvcForController{err: types.NewInvalidArgumentError("titulo requerido")}
	ctrl := NewCapituloController(svc)
	_, err := ctrl.CrearCapitulo(context.Background(), &pb.CrearCapituloRequest{IdClase: 1})
	if err == nil {
		t.Fatalf("esperaba error")
	}
}
