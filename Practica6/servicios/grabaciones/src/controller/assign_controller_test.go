package controller

import (
	"context"
	"testing"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/types"
)

type assignSvcForController struct {
	participantes []types.Participante
	material      types.MaterialApoyo
	err           error
}

func (m *assignSvcForController) AsignarDocente(params types.AsignarDocenteParams) error { return m.err }
func (m *assignSvcForController) AsignarAuxiliar(params types.AsignarAuxiliarParams) error {
	return m.err
}
func (m *assignSvcForController) AsignarMaterialApoyo(params types.AsignarMaterialApoyoParams) (types.MaterialApoyo, error) {
	return m.material, m.err
}
func (m *assignSvcForController) AsignarTemaClaseGrabada(params types.AsignarTemaClaseParams) error {
	return m.err
}
func (m *assignSvcForController) DesasignarDocente(params types.DesasignarDocenteParams) error {
	return m.err
}
func (m *assignSvcForController) DesasignarAuxiliar(params types.DesasignarAuxiliarParams) error {
	return m.err
}
func (m *assignSvcForController) DesasignarMaterialApoyo(params types.DesasignarMaterialApoyoParams) error {
	return m.err
}
func (m *assignSvcForController) DesasignarTemaClaseGrabada(params types.DesasignarTemaClaseParams) error {
	return m.err
}
func (m *assignSvcForController) ConsultarParticipantesClase(idClase int32) ([]types.Participante, error) {
	return m.participantes, m.err
}

func TestAssignController_AsignarDocente_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.AsignarDocente(context.Background(), &pb.AsignarDocenteRequest{IdClase: 1, IdUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_AsignarAuxiliar_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.AsignarAuxiliar(context.Background(), &pb.AsignarAuxiliarRequest{IdClase: 1, IdUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_AsignarMaterial_Exito(t *testing.T) {
	svc := &assignSvcForController{material: types.MaterialApoyo{ID: 1, Nombre: "PDF"}}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.AsignarMaterialApoyo(context.Background(), &pb.AsignarMaterialApoyoRequest{IdClase: 1, Nombre: "PDF", Tipo: "Doc", Url: "https://x"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_AsignarTema_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.AsignarTemaClaseGrabada(context.Background(), &pb.AsignarTemaClaseGrabadaRequest{IdClase: 1, IdTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_DesasignarDocente_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.DesasignarDocente(context.Background(), &pb.DesasignarDocenteRequest{IdClase: 1, IdUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_DesasignarAuxiliar_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.DesasignarAuxiliar(context.Background(), &pb.DesasignarAuxiliarRequest{IdClase: 1, IdUsuario: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_DesasignarMaterial_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.DesasignarMaterialApoyo(context.Background(), &pb.DesasignarMaterialApoyoRequest{IdMaterial: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_DesasignarTema_Exito(t *testing.T) {
	svc := &assignSvcForController{}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.DesasignarTemaClaseGrabada(context.Background(), &pb.DesasignarTemaClaseGrabadaRequest{IdClase: 1, IdTema: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Fatalf("esperaba exito=true")
	}
}

func TestAssignController_ConsultarParticipantes_Exito(t *testing.T) {
	svc := &assignSvcForController{participantes: []types.Participante{{IDClase: 1, IDUsuario: 1, TipoParticipante: "DOCENTE"}}}
	ctrl := NewAssignController(svc)
	resp, err := ctrl.ConsultarParticipantesClase(context.Background(), &pb.ConsultarParticipantesClaseRequest{IdClase: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Participantes) != 1 {
		t.Fatalf("esperaba 1 participante, obtuvo %d", len(resp.Participantes))
	}
}

func TestAssignController_ConsultarParticipantes_Error(t *testing.T) {
	svc := &assignSvcForController{err: types.NewInvalidArgumentError("clase requerida")}
	ctrl := NewAssignController(svc)
	_, err := ctrl.ConsultarParticipantesClase(context.Background(), &pb.ConsultarParticipantesClaseRequest{IdClase: 0})
	if err == nil {
		t.Fatalf("esperaba error")
	}
}
