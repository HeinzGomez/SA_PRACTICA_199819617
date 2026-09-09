package controller

import (
	"context"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "servicio_recursos/proto/recursos"
	"servicio_recursos/services"
	"servicio_recursos/types"
)

// ─── Mock NotesService ───────────────────────────────────

type mockNotesService struct {
	consultarFn               func(idClase, idUsuario int32) (types.ApunteInfo, error)
	crearFn                   func(idClase, idUsuario int32, titulo, contenido string) (int32, error)
	actualizarFn              func(idApunte int32, titulo, contenido string) error
	agregarMarcadorFn         func(idApunte int32, segundo int32, texto string) (int32, error)
	eliminarMarcadorFn        func(idMarcador int32) error
}

var _ services.NotesService = (*mockNotesService)(nil)

func (m *mockNotesService) ConsultarApunte(idClase, idUsuario int32) (types.ApunteInfo, error) {
	if m.consultarFn != nil {
		return m.consultarFn(idClase, idUsuario)
	}
	return types.ApunteInfo{}, nil
}
func (m *mockNotesService) CrearApunte(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
	if m.crearFn != nil {
		return m.crearFn(idClase, idUsuario, titulo, contenido)
	}
	return 1, nil
}
func (m *mockNotesService) ActualizarApunte(idApunte int32, titulo, contenido string) error {
	if m.actualizarFn != nil {
		return m.actualizarFn(idApunte, titulo, contenido)
	}
	return nil
}
func (m *mockNotesService) AgregarMarcadorTiempo(idApunte int32, segundo int32, texto string) (int32, error) {
	if m.agregarMarcadorFn != nil {
		return m.agregarMarcadorFn(idApunte, segundo, texto)
	}
	return 1, nil
}
func (m *mockNotesService) EliminarMarcadorTiempo(idMarcador int32) error {
	if m.eliminarMarcadorFn != nil {
		return m.eliminarMarcadorFn(idMarcador)
	}
	return nil
}

// ─── ConsultarApunte ─────────────────────────────────────

func TestConsultarApunte_Exito(t *testing.T) {
	svc := &mockNotesService{
		consultarFn: func(idClase, idUsuario int32) (types.ApunteInfo, error) {
			return types.ApunteInfo{
				IDApunte:  1,
				IDClase:   idClase,
				IDUsuario: idUsuario,
				Titulo:    "Mis notas",
				Marcadores: []types.MarcadorTiempo{
					{IDMarcador: 10, Segundo: 30, Texto: "Importante"},
				},
			}, nil
		},
	}
	ctrl := NewNotesController(svc)
	resp, err := ctrl.ConsultarApunte(context.Background(), &pb.ConsultarApunteRequest{
		IdClase:   1,
		IdUsuario: 2,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
	if resp.Apunte.IdApunte != 1 {
		t.Errorf("esperaba IdApunte=1, obtuvo %d", resp.Apunte.IdApunte)
	}
	if len(resp.Apunte.Marcadores) != 1 {
		t.Errorf("esperaba 1 marcador, obtuvo %d", len(resp.Apunte.Marcadores))
	}
}

func TestConsultarApunte_Error(t *testing.T) {
	svc := &mockNotesService{
		consultarFn: func(idClase, idUsuario int32) (types.ApunteInfo, error) {
			return types.ApunteInfo{}, types.NewInternalError("db error")
		},
	}
	ctrl := NewNotesController(svc)
	_, err := ctrl.ConsultarApunte(context.Background(), &pb.ConsultarApunteRequest{
		IdClase: 1, IdUsuario: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
}

// ─── CrearApunte ─────────────────────────────────────────

func TestCrearApunte_Exito(t *testing.T) {
	svc := &mockNotesService{
		crearFn: func(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
			if titulo != "Nuevas notas" {
				t.Errorf("esperaba titulo 'Nuevas notas', obtuvo '%s'", titulo)
			}
			return 42, nil
		},
	}
	ctrl := NewNotesController(svc)
	resp, err := ctrl.CrearApunte(context.Background(), &pb.CrearApunteRequest{
		IdClase:   1,
		IdUsuario: 2,
		Titulo:    "Nuevas notas",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdApunte != 42 {
		t.Errorf("esperaba IdApunte=42, obtuvo %d", resp.IdApunte)
	}
}

func TestCrearApunte_Error(t *testing.T) {
	svc := &mockNotesService{
		crearFn: func(idClase, idUsuario int32, titulo, contenido string) (int32, error) {
			return 0, types.NewInvalidArgumentError("título requerido")
		},
	}
	ctrl := NewNotesController(svc)
	_, err := ctrl.CrearApunte(context.Background(), &pb.CrearApunteRequest{
		IdClase: 1, IdUsuario: 1, Titulo: "",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── ActualizarApunte ────────────────────────────────────

func TestActualizarApunte_Exito(t *testing.T) {
	svc := &mockNotesService{
		actualizarFn: func(idApunte int32, titulo, contenido string) error {
			return nil
		},
	}
	ctrl := NewNotesController(svc)
	resp, err := ctrl.ActualizarApunte(context.Background(), &pb.ActualizarApunteRequest{
		IdApunte:            1,
		Titulo:              "Actualizado",
		ContenidoMarkdown:   "# Nuevo contenido",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestActualizarApunte_Error(t *testing.T) {
	svc := &mockNotesService{
		actualizarFn: func(idApunte int32, titulo, contenido string) error {
			return types.NewInternalError("update failed")
		},
	}
	ctrl := NewNotesController(svc)
	_, err := ctrl.ActualizarApunte(context.Background(), &pb.ActualizarApunteRequest{
		IdApunte: 1, Titulo: "x",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
}

// ─── AgregarMarcadorTiempo ────────────────────────────────

func TestAgregarMarcadorTiempo_Exito(t *testing.T) {
	svc := &mockNotesService{
		agregarMarcadorFn: func(idApunte int32, segundo int32, texto string) (int32, error) {
			return 99, nil
		},
	}
	ctrl := NewNotesController(svc)
	resp, err := ctrl.AgregarMarcadorTiempo(context.Background(), &pb.AgregarMarcadorTiempoRequest{
		IdApunte: 1, Segundo: 120, Texto: "Inicio",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdMarcador != 99 {
		t.Errorf("esperaba IdMarcador=99, obtuvo %d", resp.IdMarcador)
	}
}

func TestAgregarMarcadorTiempo_Error(t *testing.T) {
	svc := &mockNotesService{
		agregarMarcadorFn: func(idApunte int32, segundo int32, texto string) (int32, error) {
			return 0, types.NewInternalError("insert failed")
		},
	}
	ctrl := NewNotesController(svc)
	_, err := ctrl.AgregarMarcadorTiempo(context.Background(), &pb.AgregarMarcadorTiempoRequest{
		IdApunte: 1, Segundo: 0,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── EliminarMarcadorTiempo ───────────────────────────────

func TestEliminarMarcadorTiempo_Exito(t *testing.T) {
	svc := &mockNotesService{
		eliminarMarcadorFn: func(idMarcador int32) error {
			return nil
		},
	}
	ctrl := NewNotesController(svc)
	resp, err := ctrl.EliminarMarcadorTiempo(context.Background(), &pb.EliminarMarcadorTiempoRequest{
		IdMarcador: 5,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestEliminarMarcadorTiempo_Error(t *testing.T) {
	svc := &mockNotesService{
		eliminarMarcadorFn: func(idMarcador int32) error {
			return types.NewInternalError("delete failed")
		},
	}
	ctrl := NewNotesController(svc)
	_, err := ctrl.EliminarMarcadorTiempo(context.Background(), &pb.EliminarMarcadorTiempoRequest{
		IdMarcador: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}
