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

// ─── Mock RepoService ────────────────────────────────────

type mockRepoService struct {
	crearRepositorioFn         func(params types.CrearRepositorioParams) (int32, error)
	agregarArchivoFn           func(params types.AgregarArchivoParams) (int32, error)
	actualizarVersionFn        func(params types.ActualizarVersionArchivoParams) error
	actualizarTagFn            func(idVersion int32, tag string) error
	eliminarArchivoFn          func(idArchivo int32) error
	consultarRepositorioFn     func(idClase int32) (types.RepositorioInfo, error)
	consultarVersionesFn       func(idArchivo int32) ([]types.VersionArchivo, error)
	consultarVersionArchivoFn  func(idArchivo, idVersion int32) (types.VersionArchivo, error)
}

var _ services.RepoService = (*mockRepoService)(nil)

func (m *mockRepoService) CrearRepositorio(params types.CrearRepositorioParams) (int32, error) {
	if m.crearRepositorioFn != nil {
		return m.crearRepositorioFn(params)
	}
	return 1, nil
}
func (m *mockRepoService) AgregarArchivo(params types.AgregarArchivoParams) (int32, error) {
	if m.agregarArchivoFn != nil {
		return m.agregarArchivoFn(params)
	}
	return 1, nil
}
func (m *mockRepoService) ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error {
	if m.actualizarVersionFn != nil {
		return m.actualizarVersionFn(params)
	}
	return nil
}
func (m *mockRepoService) ActualizarTag(idVersion int32, tag string) error {
	if m.actualizarTagFn != nil {
		return m.actualizarTagFn(idVersion, tag)
	}
	return nil
}
func (m *mockRepoService) EliminarArchivo(idArchivo int32) error {
	if m.eliminarArchivoFn != nil {
		return m.eliminarArchivoFn(idArchivo)
	}
	return nil
}
func (m *mockRepoService) ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error) {
	if m.consultarRepositorioFn != nil {
		return m.consultarRepositorioFn(idClase)
	}
	return types.RepositorioInfo{}, nil
}
func (m *mockRepoService) ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error) {
	if m.consultarVersionesFn != nil {
		return m.consultarVersionesFn(idArchivo)
	}
	return nil, nil
}
func (m *mockRepoService) ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error) {
	if m.consultarVersionArchivoFn != nil {
		return m.consultarVersionArchivoFn(idArchivo, idVersion)
	}
	return types.VersionArchivo{}, nil
}

// ─── CrearRepositorio ────────────────────────────────────

func TestRepoCtrl_CrearRepositorio_Exito(t *testing.T) {
	svc := &mockRepoService{
		crearRepositorioFn: func(params types.CrearRepositorioParams) (int32, error) {
			return 10, nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.CrearRepositorio(context.Background(), &pb.CrearRepositorioRequest{
		IdClase: 1, Nombre: "Repo Test",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdRepositorio != 10 {
		t.Errorf("esperaba IdRepositorio=10, obtuvo %d", resp.IdRepositorio)
	}
}

func TestRepoCtrl_CrearRepositorio_Error(t *testing.T) {
	svc := &mockRepoService{
		crearRepositorioFn: func(params types.CrearRepositorioParams) (int32, error) {
			return 0, types.NewInvalidArgumentError("nombre requerido")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.CrearRepositorio(context.Background(), &pb.CrearRepositorioRequest{
		IdClase: 1, Nombre: "",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── AgregarArchivo ──────────────────────────────────────

func TestRepoCtrl_AgregarArchivo_Exito(t *testing.T) {
	svc := &mockRepoService{
		agregarArchivoFn: func(params types.AgregarArchivoParams) (int32, error) {
			return 55, nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.AgregarArchivo(context.Background(), &pb.AgregarArchivoRequest{
		IdRepositorio: 1, Nombre: "guia.pdf", Link: "http://x",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.IdArchivo != 55 {
		t.Errorf("esperaba IdArchivo=55, obtuvo %d", resp.IdArchivo)
	}
}

func TestRepoCtrl_AgregarArchivo_Error(t *testing.T) {
	svc := &mockRepoService{
		agregarArchivoFn: func(params types.AgregarArchivoParams) (int32, error) {
			return 0, types.NewInternalError("db error")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.AgregarArchivo(context.Background(), &pb.AgregarArchivoRequest{
		IdRepositorio: 1, Nombre: "test", Link: "http://x",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.Internal {
		t.Errorf("esperaba Internal, obtuvo %v", st.Code())
	}
}

// ─── ActualizarVersionArchivo ────────────────────────────

func TestRepoCtrl_ActualizarVersionArchivo_Exito(t *testing.T) {
	svc := &mockRepoService{
		actualizarVersionFn: func(params types.ActualizarVersionArchivoParams) error {
			return nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.ActualizarVersionArchivo(context.Background(), &pb.ActualizarVersionArchivoRequest{
		IdArchivo: 1, Link: "http://nuevo", Tag: "v2",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestRepoCtrl_ActualizarVersionArchivo_Error(t *testing.T) {
	svc := &mockRepoService{
		actualizarVersionFn: func(params types.ActualizarVersionArchivoParams) error {
			return types.NewInternalError("fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.ActualizarVersionArchivo(context.Background(), &pb.ActualizarVersionArchivoRequest{
		IdArchivo: 1, Link: "http://x",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ActualizarTag ───────────────────────────────────────

func TestRepoCtrl_ActualizarTag_Exito(t *testing.T) {
	svc := &mockRepoService{
		actualizarTagFn: func(idVersion int32, tag string) error {
			return nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.ActualizarTag(context.Background(), &pb.ActualizarTagRequest{
		IdVersion: 3, Tag: "v1.0",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestRepoCtrl_ActualizarTag_Error(t *testing.T) {
	svc := &mockRepoService{
		actualizarTagFn: func(idVersion int32, tag string) error {
			return types.NewInternalError("fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.ActualizarTag(context.Background(), &pb.ActualizarTagRequest{
		IdVersion: 1, Tag: "v1",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── EliminarArchivo ─────────────────────────────────────

func TestRepoCtrl_EliminarArchivo_Exito(t *testing.T) {
	svc := &mockRepoService{
		eliminarArchivoFn: func(idArchivo int32) error {
			return nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.EliminarArchivo(context.Background(), &pb.EliminarArchivoRequest{
		IdArchivo: 7,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestRepoCtrl_EliminarArchivo_Error(t *testing.T) {
	svc := &mockRepoService{
		eliminarArchivoFn: func(idArchivo int32) error {
			return types.NewInternalError("delete fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.EliminarArchivo(context.Background(), &pb.EliminarArchivoRequest{
		IdArchivo: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarRepositorio ────────────────────────────────

func TestRepoCtrl_ConsultarRepositorio_Exito(t *testing.T) {
	svc := &mockRepoService{
		consultarRepositorioFn: func(idClase int32) (types.RepositorioInfo, error) {
			return types.RepositorioInfo{
				IDRepositorio: 1,
				IDClase:       idClase,
				Nombre:        "Repo Clase",
				Archivos: []types.ArchivoRepositorio{
					{IDArchivo: 10, Nombre: "guia.pdf"},
				},
			}, nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.ConsultarRepositorio(context.Background(), &pb.ConsultarRepositorioRequest{
		IdClase: 1,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if len(resp.Repositorio.Archivos) != 1 {
		t.Errorf("esperaba 1 archivo, obtuvo %d", len(resp.Repositorio.Archivos))
	}
}

func TestRepoCtrl_ConsultarRepositorio_Error(t *testing.T) {
	svc := &mockRepoService{
		consultarRepositorioFn: func(idClase int32) (types.RepositorioInfo, error) {
			return types.RepositorioInfo{}, types.NewInternalError("query fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.ConsultarRepositorio(context.Background(), &pb.ConsultarRepositorioRequest{
		IdClase: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarVersionesArchivo ───────────────────────────

func TestRepoCtrl_ConsultarVersionesArchivo_Exito(t *testing.T) {
	svc := &mockRepoService{
		consultarVersionesFn: func(idArchivo int32) ([]types.VersionArchivo, error) {
			return []types.VersionArchivo{
				{IDVersion: 1, IDArchivo: idArchivo, Link: "http://v1"},
				{IDVersion: 2, IDArchivo: idArchivo, Link: "http://v2", EsLatest: true},
			}, nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.ConsultarVersionesArchivo(context.Background(), &pb.ConsultarVersionesArchivoRequest{
		IdArchivo: 5,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if len(resp.Versiones) != 2 {
		t.Errorf("esperaba 2 versiones, obtuvo %d", len(resp.Versiones))
	}
}

func TestRepoCtrl_ConsultarVersionesArchivo_Error(t *testing.T) {
	svc := &mockRepoService{
		consultarVersionesFn: func(idArchivo int32) ([]types.VersionArchivo, error) {
			return nil, types.NewInternalError("fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.ConsultarVersionesArchivo(context.Background(), &pb.ConsultarVersionesArchivoRequest{
		IdArchivo: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarVersionArchivo ─────────────────────────────

func TestRepoCtrl_ConsultarVersionArchivo_Exito(t *testing.T) {
	svc := &mockRepoService{
		consultarVersionArchivoFn: func(idArchivo, idVersion int32) (types.VersionArchivo, error) {
			return types.VersionArchivo{
				IDVersion: idVersion, IDArchivo: idArchivo, Link: "http://v1", EsLatest: true,
			}, nil
		},
	}
	ctrl := NewRepoController(svc)
	resp, err := ctrl.ConsultarVersionArchivo(context.Background(), &pb.ConsultarVersionArchivoRequest{
		IdArchivo: 5, IdVersion: 2,
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if resp.Version.IdVersion != 2 {
		t.Errorf("esperaba IdVersion=2, obtuvo %d", resp.Version.IdVersion)
	}
}

func TestRepoCtrl_ConsultarVersionArchivo_Error(t *testing.T) {
	svc := &mockRepoService{
		consultarVersionArchivoFn: func(idArchivo, idVersion int32) (types.VersionArchivo, error) {
			return types.VersionArchivo{}, types.NewInternalError("fail")
		},
	}
	ctrl := NewRepoController(svc)
	_, err := ctrl.ConsultarVersionArchivo(context.Background(), &pb.ConsultarVersionArchivoRequest{
		IdArchivo: 1, IdVersion: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}
