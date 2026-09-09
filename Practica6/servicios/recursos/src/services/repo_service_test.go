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

type mockRepoRepository struct {
	crearRepositorioFn        func(params types.CrearRepositorioParams) (int32, error)
	agregarArchivoFn          func(params types.AgregarArchivoParams) (int32, error)
	actualizarVersionArchivoFn func(params types.ActualizarVersionArchivoParams) error
	actualizarTagFn           func(idVersion int32, tag string) error
	eliminarArchivoFn         func(idArchivo int32) error
	consultarRepositorioFn    func(idClase int32) (types.RepositorioInfo, error)
	consultarVersionesArchivoFn func(idArchivo int32) ([]types.VersionArchivo, error)
	consultarVersionArchivoFn func(idArchivo, idVersion int32) (types.VersionArchivo, error)
}

var _ repositories.RepoRepository = (*mockRepoRepository)(nil)

func (m *mockRepoRepository) CrearRepositorio(params types.CrearRepositorioParams) (int32, error) {
	if m.crearRepositorioFn != nil {
		return m.crearRepositorioFn(params)
	}
	return 1, nil
}
func (m *mockRepoRepository) AgregarArchivo(params types.AgregarArchivoParams) (int32, error) {
	if m.agregarArchivoFn != nil {
		return m.agregarArchivoFn(params)
	}
	return 1, nil
}
func (m *mockRepoRepository) ActualizarVersionArchivo(params types.ActualizarVersionArchivoParams) error {
	if m.actualizarVersionArchivoFn != nil {
		return m.actualizarVersionArchivoFn(params)
	}
	return nil
}
func (m *mockRepoRepository) ActualizarTag(idVersion int32, tag string) error {
	if m.actualizarTagFn != nil {
		return m.actualizarTagFn(idVersion, tag)
	}
	return nil
}
func (m *mockRepoRepository) EliminarArchivo(idArchivo int32) error {
	if m.eliminarArchivoFn != nil {
		return m.eliminarArchivoFn(idArchivo)
	}
	return nil
}
func (m *mockRepoRepository) ConsultarRepositorio(idClase int32) (types.RepositorioInfo, error) {
	if m.consultarRepositorioFn != nil {
		return m.consultarRepositorioFn(idClase)
	}
	return types.RepositorioInfo{}, nil
}
func (m *mockRepoRepository) ConsultarVersionesArchivo(idArchivo int32) ([]types.VersionArchivo, error) {
	if m.consultarVersionesArchivoFn != nil {
		return m.consultarVersionesArchivoFn(idArchivo)
	}
	return nil, nil
}
func (m *mockRepoRepository) ConsultarVersionArchivo(idArchivo, idVersion int32) (types.VersionArchivo, error) {
	if m.consultarVersionArchivoFn != nil {
		return m.consultarVersionArchivoFn(idArchivo, idVersion)
	}
	return types.VersionArchivo{}, nil
}

// ─── CrearRepositorio ────────────────────────────────────

func TestCrearRepositorio_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		crearRepositorioFn: func(params types.CrearRepositorioParams) (int32, error) {
			if params.IDClase != 1 || params.Nombre != "Repo Principal" {
				t.Errorf("parámetros inesperados: %+v", params)
			}
			return 10, nil
		},
	}
	svc := NewRepoService(repo)
	id, err := svc.CrearRepositorio(types.CrearRepositorioParams{IDClase: 1, Nombre: "Repo Principal"})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 10 {
		t.Fatalf("esperaba id=10, obtuvo %d", id)
	}
}

func TestCrearRepositorio_IDClaseInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.CrearRepositorio(types.CrearRepositorioParams{IDClase: 0, Nombre: "Test"})
	if err == nil {
		t.Fatal("esperaba error por IDClase inválido")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearRepositorio_NombreVacio(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.CrearRepositorio(types.CrearRepositorioParams{IDClase: 1, Nombre: ""})
	if err == nil {
		t.Fatal("esperaba error por nombre vacío")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestCrearRepositorio_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		crearRepositorioFn: func(params types.CrearRepositorioParams) (int32, error) {
			return 0, fmt.Errorf("unique violation")
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.CrearRepositorio(types.CrearRepositorioParams{IDClase: 1, Nombre: "Test"})
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── AgregarArchivo ──────────────────────────────────────

func TestAgregarArchivo_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		agregarArchivoFn: func(params types.AgregarArchivoParams) (int32, error) {
			if params.IDRepositorio != 1 {
				t.Errorf("esperaba IDRepositorio=1, obtuvo %d", params.IDRepositorio)
			}
			if params.Hash == "" {
				t.Error("esperaba hash auto-generado no vacío")
			}
			return 42, nil
		},
	}
	svc := NewRepoService(repo)
	id, err := svc.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: 1,
		Nombre:        "Guía.pdf",
		Link:          "https://drive.google.com/file/d/abc/view",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if id != 42 {
		t.Fatalf("esperaba id=42, obtuvo %d", id)
	}
}

func TestAgregarArchivo_IDRepositorioInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.AgregarArchivo(types.AgregarArchivoParams{IDRepositorio: 0, Nombre: "test", Link: "http://x"})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestAgregarArchivo_NombreVacio(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.AgregarArchivo(types.AgregarArchivoParams{IDRepositorio: 1, Nombre: "", Link: "http://x"})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestAgregarArchivo_LinkVacio(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.AgregarArchivo(types.AgregarArchivoParams{IDRepositorio: 1, Nombre: "test", Link: ""})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestAgregarArchivo_HashAutoGenerado(t *testing.T) {
	var hashRecibido string
	repo := &mockRepoRepository{
		agregarArchivoFn: func(params types.AgregarArchivoParams) (int32, error) {
			hashRecibido = params.Hash
			return 1, nil
		},
	}
	svc := NewRepoService(repo)
	svc.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: 1, Nombre: "test", Link: "http://x", Hash: "client-hash",
	})
	if hashRecibido == "client-hash" {
		t.Error("el hash del cliente debió ser sobreescrito")
	}
	if len(hashRecibido) != 16 {
		t.Errorf("esperaba hash de 16 chars, obtuvo %d: %s", len(hashRecibido), hashRecibido)
	}
}

func TestAgregarArchivo_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		agregarArchivoFn: func(params types.AgregarArchivoParams) (int32, error) {
			return 0, fmt.Errorf("db error")
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.AgregarArchivo(types.AgregarArchivoParams{
		IDRepositorio: 1, Nombre: "test", Link: "http://x",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ActualizarVersionArchivo ────────────────────────────

func TestActualizarVersionArchivo_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		actualizarVersionArchivoFn: func(params types.ActualizarVersionArchivoParams) error {
			if params.IDArchivo != 5 {
				t.Errorf("esperaba IDArchivo=5, obtuvo %d", params.IDArchivo)
			}
			if params.Hash == "" {
				t.Error("esperaba hash auto-generado")
			}
			return nil
		},
	}
	svc := NewRepoService(repo)
	err := svc.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{
		IDArchivo: 5, Link: "https://nuevo-link.com", Tag: "v2",
	})
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestActualizarVersionArchivo_IDInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	err := svc.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{IDArchivo: 0, Link: "http://x"})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestActualizarVersionArchivo_LinkVacio(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	err := svc.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{IDArchivo: 1, Link: ""})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestActualizarVersionArchivo_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		actualizarVersionArchivoFn: func(params types.ActualizarVersionArchivoParams) error {
			return fmt.Errorf("update failed")
		},
	}
	svc := NewRepoService(repo)
	err := svc.ActualizarVersionArchivo(types.ActualizarVersionArchivoParams{
		IDArchivo: 1, Link: "http://x",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ActualizarTag ───────────────────────────────────────

func TestActualizarTag_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		actualizarTagFn: func(idVersion int32, tag string) error {
			if idVersion != 3 || tag != "v1.0" {
				t.Errorf("parámetros inesperados: %d %s", idVersion, tag)
			}
			return nil
		},
	}
	svc := NewRepoService(repo)
	err := svc.ActualizarTag(3, "v1.0")
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestActualizarTag_IDInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	err := svc.ActualizarTag(0, "v1")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestActualizarTag_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		actualizarTagFn: func(idVersion int32, tag string) error {
			return fmt.Errorf("update failed")
		},
	}
	svc := NewRepoService(repo)
	err := svc.ActualizarTag(1, "v1")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── EliminarArchivo ─────────────────────────────────────

func TestEliminarArchivo_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		eliminarArchivoFn: func(idArchivo int32) error {
			if idArchivo != 7 {
				t.Errorf("esperaba idArchivo=7, obtuvo %d", idArchivo)
			}
			return nil
		},
	}
	svc := NewRepoService(repo)
	err := svc.EliminarArchivo(7)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
}

func TestEliminarArchivo_IDInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	err := svc.EliminarArchivo(0)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestEliminarArchivo_NoEncontrado(t *testing.T) {
	repo := &mockRepoRepository{
		eliminarArchivoFn: func(idArchivo int32) error {
			return sql.ErrNoRows
		},
	}
	svc := NewRepoService(repo)
	err := svc.EliminarArchivo(1)
	if err == nil {
		t.Fatal("esperaba error NOT_FOUND")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestEliminarArchivo_ErrorInterno(t *testing.T) {
	repo := &mockRepoRepository{
		eliminarArchivoFn: func(idArchivo int32) error {
			return fmt.Errorf("delete failed")
		},
	}
	svc := NewRepoService(repo)
	err := svc.EliminarArchivo(1)
	if err == nil {
		t.Fatal("esperaba error INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ConsultarRepositorio ────────────────────────────────

func TestConsultarRepositorio_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		consultarRepositorioFn: func(idClase int32) (types.RepositorioInfo, error) {
			return types.RepositorioInfo{
				IDRepositorio: 1,
				IDClase:       idClase,
				Nombre:        "Repo Clase 1",
				Archivos: []types.ArchivoRepositorio{
					{IDArchivo: 10, Nombre: "guia.pdf"},
				},
			}, nil
		},
	}
	svc := NewRepoService(repo)
	info, err := svc.ConsultarRepositorio(1)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if info.IDRepositorio != 1 || info.Nombre != "Repo Clase 1" {
		t.Errorf("datos inesperados: %+v", info)
	}
	if len(info.Archivos) != 1 {
		t.Errorf("esperaba 1 archivo, obtuvo %d", len(info.Archivos))
	}
}

func TestConsultarRepositorio_IDInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.ConsultarRepositorio(0)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarRepositorio_NoEncontrado(t *testing.T) {
	repo := &mockRepoRepository{
		consultarRepositorioFn: func(idClase int32) (types.RepositorioInfo, error) {
			return types.RepositorioInfo{}, nil
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.ConsultarRepositorio(999)
	if err == nil {
		t.Fatal("esperaba NOT_FOUND")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestConsultarRepositorio_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		consultarRepositorioFn: func(idClase int32) (types.RepositorioInfo, error) {
			return types.RepositorioInfo{}, fmt.Errorf("query failed")
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.ConsultarRepositorio(1)
	if err == nil {
		t.Fatal("esperaba INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ConsultarVersionesArchivo ───────────────────────────

func TestConsultarVersionesArchivo_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		consultarVersionesArchivoFn: func(idArchivo int32) ([]types.VersionArchivo, error) {
			return []types.VersionArchivo{
				{IDVersion: 1, IDArchivo: idArchivo, Link: "http://v1", EsLatest: false},
				{IDVersion: 2, IDArchivo: idArchivo, Link: "http://v2", EsLatest: true},
			}, nil
		},
	}
	svc := NewRepoService(repo)
	versiones, err := svc.ConsultarVersionesArchivo(5)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if len(versiones) != 2 {
		t.Fatalf("esperaba 2 versiones, obtuvo %d", len(versiones))
	}
	if !versiones[1].EsLatest {
		t.Error("esperaba que la versión 2 fuera latest")
	}
}

func TestConsultarVersionesArchivo_IDInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.ConsultarVersionesArchivo(-1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarVersionesArchivo_ErrorRepositorio(t *testing.T) {
	repo := &mockRepoRepository{
		consultarVersionesArchivoFn: func(idArchivo int32) ([]types.VersionArchivo, error) {
			return nil, fmt.Errorf("query failed")
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.ConsultarVersionesArchivo(1)
	if err == nil {
		t.Fatal("esperaba INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ConsultarVersionArchivo ─────────────────────────────

func TestConsultarVersionArchivo_Exito(t *testing.T) {
	repo := &mockRepoRepository{
		consultarVersionArchivoFn: func(idArchivo, idVersion int32) (types.VersionArchivo, error) {
			return types.VersionArchivo{
				IDVersion: idVersion, IDArchivo: idArchivo, Link: "http://v1", EsLatest: true,
			}, nil
		},
	}
	svc := NewRepoService(repo)
	v, err := svc.ConsultarVersionArchivo(5, 2)
	if err != nil {
		t.Fatalf("esperaba nil error, obtuvo: %v", err)
	}
	if v.IDVersion != 2 || v.IDArchivo != 5 {
		t.Errorf("datos inesperados: %+v", v)
	}
}

func TestConsultarVersionArchivo_IDArchivoInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.ConsultarVersionArchivo(0, 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarVersionArchivo_IDVersionInvalido(t *testing.T) {
	svc := NewRepoService(&mockRepoRepository{})
	_, err := svc.ConsultarVersionArchivo(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarVersionArchivo_NoEncontrado(t *testing.T) {
	repo := &mockRepoRepository{
		consultarVersionArchivoFn: func(idArchivo, idVersion int32) (types.VersionArchivo, error) {
			return types.VersionArchivo{}, sql.ErrNoRows
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.ConsultarVersionArchivo(1, 99)
	if err == nil {
		t.Fatal("esperaba NOT_FOUND")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestConsultarVersionArchivo_ErrorInterno(t *testing.T) {
	repo := &mockRepoRepository{
		consultarVersionArchivoFn: func(idArchivo, idVersion int32) (types.VersionArchivo, error) {
			return types.VersionArchivo{}, fmt.Errorf("query failed")
		},
	}
	svc := NewRepoService(repo)
	_, err := svc.ConsultarVersionArchivo(1, 1)
	if err == nil {
		t.Fatal("esperaba INTERNAL")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}
