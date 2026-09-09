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

// ─── Mock ForumService ───────────────────────────────────

type mockForumService struct {
	consultarDudasClaseFn func(idClase, pagina int32) ([]types.DudaInfo, int32, error)
	crearDudaFn           func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error)
	crearRespuestaFn      func(idDuda, idUsuario int32, respuesta string) (int32, error)
	marcarRespuestaFn     func(idRespuesta, idUsuario int32) error
}

var _ services.ForumService = (*mockForumService)(nil)

func (m *mockForumService) ConsultarDudasClase(idClase, pagina int32) ([]types.DudaInfo, int32, error) {
	if m.consultarDudasClaseFn != nil {
		return m.consultarDudasClaseFn(idClase, pagina)
	}
	return nil, 0, nil
}
func (m *mockForumService) CrearDuda(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
	if m.crearDudaFn != nil {
		return m.crearDudaFn(idClase, idUsuario, duda, segundo)
	}
	return 1, nil
}
func (m *mockForumService) CrearRespuesta(idDuda, idUsuario int32, respuesta string) (int32, error) {
	if m.crearRespuestaFn != nil {
		return m.crearRespuestaFn(idDuda, idUsuario, respuesta)
	}
	return 1, nil
}
func (m *mockForumService) MarcarRespuesta(idRespuesta, idUsuario int32) error {
	if m.marcarRespuestaFn != nil {
		return m.marcarRespuestaFn(idRespuesta, idUsuario)
	}
	return nil
}

// ─── ConsultarDudasClase ─────────────────────────────────

func TestForumCtrl_ConsultarDudasClase_Exito(t *testing.T) {
	svc := &mockForumService{
		consultarDudasClaseFn: func(idClase, pagina int32) ([]types.DudaInfo, int32, error) {
			return []types.DudaInfo{
				{IDDudas: 1, IDClase: 10, IDUsuario: 20, Duda: "¿Qué es?", Segundo: int32Ptr(30),
					Respuestas: []types.RespuestaInfo{
						{IDRespuesta: 1, IDDuda: 1, IDUsuario: 30, Respuesta: "Es esto", Marcada: false},
					},
				},
			}, 2, nil
		},
	}
	ctrl := NewForumController(svc)
	resp, err := ctrl.ConsultarDudasClase(context.Background(), &pb.ConsultarDudasClaseRequest{
		IdClase: 10, Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
	if resp.TotalPaginas != 2 {
		t.Errorf("esperaba 2 paginas, obtuvo %d", resp.TotalPaginas)
	}
	if len(resp.Dudas) != 1 {
		t.Fatalf("esperaba 1 duda, obtuvo %d", len(resp.Dudas))
	}
	if len(resp.Dudas[0].Respuestas) != 1 {
		t.Errorf("esperaba 1 respuesta, obtuvo %d", len(resp.Dudas[0].Respuestas))
	}
}

func TestForumCtrl_ConsultarDudasClase_Error(t *testing.T) {
	svc := &mockForumService{
		consultarDudasClaseFn: func(idClase, pagina int32) ([]types.DudaInfo, int32, error) {
			return nil, 0, types.NewInvalidArgumentError("id inválido")
		},
	}
	ctrl := NewForumController(svc)
	_, err := ctrl.ConsultarDudasClase(context.Background(), &pb.ConsultarDudasClaseRequest{
		IdClase: 0,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── CrearDuda ───────────────────────────────────────────

func TestForumCtrl_CrearDuda_Exito(t *testing.T) {
	svc := &mockForumService{
		crearDudaFn: func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
			return 15, nil
		},
	}
	ctrl := NewForumController(svc)
	seg := int32(60)
	resp, err := ctrl.CrearDuda(context.Background(), &pb.CrearDudaRequest{
		IdClase: 10, IdUsuario: 20, Duda: "¿Qué es?", Segundo: &seg,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdDudas != 15 {
		t.Errorf("esperaba IdDudas=15, obtuvo %d", resp.IdDudas)
	}
}

func TestForumCtrl_CrearDuda_Error(t *testing.T) {
	svc := &mockForumService{
		crearDudaFn: func(idClase, idUsuario int32, duda string, segundo *int32) (int32, error) {
			return 0, types.NewInvalidArgumentError("duda requerida")
		},
	}
	ctrl := NewForumController(svc)
	_, err := ctrl.CrearDuda(context.Background(), &pb.CrearDudaRequest{
		IdClase: 10, IdUsuario: 20, Duda: "",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── CrearRespuesta ──────────────────────────────────────

func TestForumCtrl_CrearRespuesta_Exito(t *testing.T) {
	svc := &mockForumService{
		crearRespuestaFn: func(idDuda, idUsuario int32, respuesta string) (int32, error) {
			return 25, nil
		},
	}
	ctrl := NewForumController(svc)
	resp, err := ctrl.CrearRespuesta(context.Background(), &pb.CrearRespuestaRequest{
		IdDuda: 1, IdUsuario: 20, Respuesta: "Mi respuesta",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdRespuesta != 25 {
		t.Errorf("esperaba IdRespuesta=25, obtuvo %d", resp.IdRespuesta)
	}
}

func TestForumCtrl_CrearRespuesta_Error(t *testing.T) {
	svc := &mockForumService{
		crearRespuestaFn: func(idDuda, idUsuario int32, respuesta string) (int32, error) {
			return 0, types.NewInternalError("db error")
		},
	}
	ctrl := NewForumController(svc)
	_, err := ctrl.CrearRespuesta(context.Background(), &pb.CrearRespuestaRequest{
		IdDuda: 1, IdUsuario: 20, Respuesta: "test",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
}

// ─── MarcarRespuesta ─────────────────────────────────────

func TestForumCtrl_MarcarRespuesta_Exito(t *testing.T) {
	svc := &mockForumService{
		marcarRespuestaFn: func(idRespuesta, idUsuario int32) error {
			return nil
		},
	}
	ctrl := NewForumController(svc)
	resp, err := ctrl.MarcarRespuesta(context.Background(), &pb.MarcarRespuestaRequest{
		IdRespuesta: 1, IdUsuario: 20,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestForumCtrl_MarcarRespuesta_Error(t *testing.T) {
	svc := &mockForumService{
		marcarRespuestaFn: func(idRespuesta, idUsuario int32) error {
			return types.NewNotFoundError("no encontrada")
		},
	}
	ctrl := NewForumController(svc)
	_, err := ctrl.MarcarRespuesta(context.Background(), &pb.MarcarRespuestaRequest{
		IdRespuesta: 999, IdUsuario: 20,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.NotFound {
		t.Errorf("esperaba NotFound, obtuvo %v", st.Code())
	}
}

// ─── helpers ─────────────────────────────────────────────

func int32Ptr(v int32) *int32 {
	return &v
}
