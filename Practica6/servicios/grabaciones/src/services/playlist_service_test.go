package services

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

// ─── Mock PlaylistRepository ─────────────────────────────

type mockPlaylistRepo struct {
	consultarPlaylistsUsuarioFn    func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error)
	consultarPlaylistPorHashFn     func(shareToken string) (types.Playlist, error)
	consultarVideosPlaylistFn      func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error)
	consultarVideosPlaylistPorHashFn func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error)
	crearPlaylistFn                func(params types.CrearPlaylistParams) (int32, error)
	eliminarPlaylistFn             func(idPlaylist, idUsuario int32) error
	cambiarVisibilidadPlaylistFn   func(params types.CambiarVisibilidadParams) error
	agregarVideoPlaylistFn         func(params types.AgregarVideoParams) (int32, error)
	eliminarVideoPlaylistFn        func(idPlaylistClases, idUsuario int32) error
	generarLinkPlaylistFn          func(idPlaylist, idUsuario int32) (string, error)
	buscarPlaylistPorIDFn          func(idPlaylist int32) (types.Playlist, error)
}

var _ repositories.PlaylistRepository = (*mockPlaylistRepo)(nil)

func (m *mockPlaylistRepo) ConsultarPlaylistsUsuario(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
	if m.consultarPlaylistsUsuarioFn != nil {
		return m.consultarPlaylistsUsuarioFn(params)
	}
	return types.ConsultarPlaylistsResult{}, nil
}
func (m *mockPlaylistRepo) ConsultarPlaylistPorHash(shareToken string) (types.Playlist, error) {
	if m.consultarPlaylistPorHashFn != nil {
		return m.consultarPlaylistPorHashFn(shareToken)
	}
	return types.Playlist{}, nil
}
func (m *mockPlaylistRepo) ConsultarVideosPlaylist(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
	if m.consultarVideosPlaylistFn != nil {
		return m.consultarVideosPlaylistFn(params)
	}
	return types.ConsultarVideosPlaylistResult{}, nil
}
func (m *mockPlaylistRepo) ConsultarVideosPlaylistPorHash(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
	if m.consultarVideosPlaylistPorHashFn != nil {
		return m.consultarVideosPlaylistPorHashFn(shareToken, pagina)
	}
	return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, nil
}
func (m *mockPlaylistRepo) CrearPlaylist(params types.CrearPlaylistParams) (int32, error) {
	if m.crearPlaylistFn != nil {
		return m.crearPlaylistFn(params)
	}
	return 1, nil
}
func (m *mockPlaylistRepo) EliminarPlaylist(idPlaylist, idUsuario int32) error {
	if m.eliminarPlaylistFn != nil {
		return m.eliminarPlaylistFn(idPlaylist, idUsuario)
	}
	return nil
}
func (m *mockPlaylistRepo) CambiarVisibilidadPlaylist(params types.CambiarVisibilidadParams) error {
	if m.cambiarVisibilidadPlaylistFn != nil {
		return m.cambiarVisibilidadPlaylistFn(params)
	}
	return nil
}
func (m *mockPlaylistRepo) AgregarVideoPlaylist(params types.AgregarVideoParams) (int32, error) {
	if m.agregarVideoPlaylistFn != nil {
		return m.agregarVideoPlaylistFn(params)
	}
	return 1, nil
}
func (m *mockPlaylistRepo) EliminarVideoPlaylist(idPlaylistClases, idUsuario int32) error {
	if m.eliminarVideoPlaylistFn != nil {
		return m.eliminarVideoPlaylistFn(idPlaylistClases, idUsuario)
	}
	return nil
}
func (m *mockPlaylistRepo) GenerarLinkPlaylist(idPlaylist, idUsuario int32) (string, error) {
	if m.generarLinkPlaylistFn != nil {
		return m.generarLinkPlaylistFn(idPlaylist, idUsuario)
	}
	return "token", nil
}
func (m *mockPlaylistRepo) BuscarPlaylistPorID(idPlaylist int32) (types.Playlist, error) {
	if m.buscarPlaylistPorIDFn != nil {
		return m.buscarPlaylistPorIDFn(idPlaylist)
	}
	return types.Playlist{}, nil
}

// ─── Mock ClassRepository ────────────────────────────────

type mockClassRepoForPlaylist struct {
	buscarClaseGrabadaFn func(idClase int32) (types.ClaseGrabada, error)
}

var _ repositories.ClassRepository = (*mockClassRepoForPlaylist)(nil)

func (m *mockClassRepoForPlaylist) CrearClaseGrabada(params types.CrearClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *mockClassRepoForPlaylist) EditarClaseGrabada(params types.EditarClaseGrabadaParams) (types.ClaseGrabada, error) {
	return types.ClaseGrabada{}, nil
}
func (m *mockClassRepoForPlaylist) EliminarClaseGrabada(idClase int32) error { return nil }
func (m *mockClassRepoForPlaylist) BuscarClaseGrabada(idClase int32) (types.ClaseGrabada, error) {
	if m.buscarClaseGrabadaFn != nil {
		return m.buscarClaseGrabadaFn(idClase)
	}
	return types.ClaseGrabada{}, nil
}
func (m *mockClassRepoForPlaylist) ConsultarCatalogoClases(params types.ConsultarCatalogoClasesParams) (types.CatalogoClasesResult, error) {
	return types.CatalogoClasesResult{}, nil
}
func (m *mockClassRepoForPlaylist) BusquedaAvanzada(filtros types.BusquedaAvanzadaFiltros) (types.BusquedaAvanzadaResult, error) {
	return types.BusquedaAvanzadaResult{}, nil
}
func (m *mockClassRepoForPlaylist) ConsultarFichaTecnica(idClase int32) ([]types.FichaTecnicaRow, error) {
	return nil, nil
}
func (m *mockClassRepoForPlaylist) ObtenerEnlaceClaseGrabada(idClase int32) (string, error) {
	return "", nil
}
func (m *mockClassRepoForPlaylist) CargaMasivaClases(pClasesJSON string) (string, error) {
	return "", nil
}

// ─── ConsultarPlaylistsUsuario ───────────────────────────

func TestConsultarPlaylistsUsuario_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistsUsuarioFn: func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
			if params.IDUsuario != 10 || params.Pagina != 1 {
				t.Errorf("parámetros inesperados: %+v", params)
			}
			return types.ConsultarPlaylistsResult{
				Playlists:   []types.Playlist{{ID: 1, Titulo: "P1"}},
				TotalPaginas: 2,
			}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	result, err := svc.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalPaginas != 2 {
		t.Errorf("esperaba 2 paginas, obtuvo %d", result.TotalPaginas)
	}
}

func TestConsultarPlaylistsUsuario_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarPlaylistsUsuario_PaginaDefault(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistsUsuarioFn: func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
			if params.Pagina != 1 {
				t.Errorf("esperaba pagina=1 (default), obtuvo %d", params.Pagina)
			}
			return types.ConsultarPlaylistsResult{}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	svc.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: -1})
}

func TestConsultarPlaylistsUsuario_ErrorRepositorio(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistsUsuarioFn: func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
			return types.ConsultarPlaylistsResult{}, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ConsultarPlaylistPorHash ────────────────────────────

func TestConsultarPlaylistPorHash_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistPorHashFn: func(shareToken string) (types.Playlist, error) {
			return types.Playlist{ID: 1, Titulo: "Publica", Visibilidad: "Publica"}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	p, err := svc.ConsultarPlaylistPorHash("abc123")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if p.ID != 1 {
		t.Errorf("esperaba ID=1, obtuvo %d", p.ID)
	}
}

func TestConsultarPlaylistPorHash_TokenVacio(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistPorHash("")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarPlaylistPorHash_TokenEspacios(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistPorHash("   ")
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarPlaylistPorHash_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistPorHashFn: func(shareToken string) (types.Playlist, error) {
			return types.Playlist{}, sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistPorHash("invalid")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestConsultarPlaylistPorHash_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarPlaylistPorHashFn: func(shareToken string) (types.Playlist, error) {
			return types.Playlist{}, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarPlaylistPorHash("abc")
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInternal {
		t.Errorf("esperaba INTERNAL, obtuvo: %v", err)
	}
}

// ─── ConsultarVideosPlaylist ─────────────────────────────

func TestConsultarVideosPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistFn: func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
			return types.ConsultarVideosPlaylistResult{
				Videos:      []types.VideoPlaylist{{IDPlaylistClases: 1, TituloClase: "Clase 1"}},
				TotalPaginas: 1,
			}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	result, err := svc.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Videos) != 1 {
		t.Errorf("esperaba 1 video, obtuvo %d", len(result.Videos))
	}
}

func TestConsultarVideosPlaylist_IDPlaylistInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarVideosPlaylist_PaginaDefault(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistFn: func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
			if params.Pagina != 1 {
				t.Errorf("esperaba pagina=1 (default), obtuvo %d", params.Pagina)
			}
			return types.ConsultarVideosPlaylistResult{}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	svc.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: -1})
}

func TestConsultarVideosPlaylist_ErrorRepositorio(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistFn: func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
			return types.ConsultarVideosPlaylistResult{}, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarVideosPlaylistPorHash ──────────────────────

func TestConsultarVideosPlaylistPorHash_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			return types.Playlist{ID: 1}, types.ConsultarVideosPlaylistResult{Videos: []types.VideoPlaylist{{IDClase: 10}}}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	p, result, err := svc.ConsultarVideosPlaylistPorHash("abc", 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if p.ID != 1 || len(result.Videos) != 1 {
		t.Errorf("datos inesperados")
	}
}

func TestConsultarVideosPlaylistPorHash_TokenVacio(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, _, err := svc.ConsultarVideosPlaylistPorHash("", 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeInvalidArgument {
		t.Errorf("esperaba INVALID_ARGUMENT, obtuvo: %v", err)
	}
}

func TestConsultarVideosPlaylistPorHash_TokenEspacios(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, _, err := svc.ConsultarVideosPlaylistPorHash("   ", 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestConsultarVideosPlaylistPorHash_PaginaDefault(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			if pagina != 1 {
				t.Errorf("esperaba pagina=1 (default), obtuvo %d", pagina)
			}
			return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	svc.ConsultarVideosPlaylistPorHash("abc", -1)
}

func TestConsultarVideosPlaylistPorHash_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, _, err := svc.ConsultarVideosPlaylistPorHash("invalid", 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestConsultarVideosPlaylistPorHash_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, _, err := svc.ConsultarVideosPlaylistPorHash("abc", 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── CrearPlaylist ───────────────────────────────────────

func TestCrearPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		crearPlaylistFn: func(params types.CrearPlaylistParams) (int32, error) {
			if params.Titulo != "Mi Playlist" {
				t.Errorf("esperaba titulo 'Mi Playlist', obtuvo '%s'", params.Titulo)
			}
			return 10, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	id, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: "Mi Playlist"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 10 {
		t.Fatalf("esperaba id=10, obtuvo %d", id)
	}
}

func TestCrearPlaylist_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 0, Titulo: "test"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCrearPlaylist_TituloVacio(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: ""})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCrearPlaylist_TituloEspacios(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: "   "})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCrearPlaylist_VisibilidadDefault(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		crearPlaylistFn: func(params types.CrearPlaylistParams) (int32, error) {
			if params.Visibilidad != "Privada" {
				t.Errorf("esperaba visibilidad 'Privada', obtuvo '%s'", params.Visibilidad)
			}
			return 1, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: "test", Visibilidad: ""})
}

func TestCrearPlaylist_VisibilidadInvalida(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: "test", Visibilidad: "Otra"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCrearPlaylist_ErrorRepositorio(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		crearPlaylistFn: func(params types.CrearPlaylistParams) (int32, error) {
			return 0, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.CrearPlaylist(types.CrearPlaylistParams{IDUsuario: 10, Titulo: "test"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── EliminarPlaylist ────────────────────────────────────

func TestEliminarPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarPlaylistFn: func(idPlaylist, idUsuario int32) error {
			if idPlaylist != 1 || idUsuario != 10 {
				t.Errorf("parámetros inesperados")
			}
			return nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarPlaylist_IDPlaylistInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.EliminarPlaylist(0, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarPlaylist_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.EliminarPlaylist(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarPlaylist_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarPlaylistFn: func(idPlaylist, idUsuario int32) error {
			return sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestEliminarPlaylist_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarPlaylistFn: func(idPlaylist, idUsuario int32) error {
			return fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── CambiarVisibilidadPlaylist ──────────────────────────

func TestCambiarVisibilidadPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		cambiarVisibilidadPlaylistFn: func(params types.CambiarVisibilidadParams) error {
			return nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica"})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestCambiarVisibilidadPlaylist_IDPlaylistInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 0, IDUsuario: 10, Visibilidad: "Publica"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCambiarVisibilidadPlaylist_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 1, IDUsuario: 0, Visibilidad: "Publica"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCambiarVisibilidadPlaylist_VisibilidadInvalida(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Otra"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCambiarVisibilidadPlaylist_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		cambiarVisibilidadPlaylistFn: func(params types.CambiarVisibilidadParams) error {
			return sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCambiarVisibilidadPlaylist_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		cambiarVisibilidadPlaylistFn: func(params types.CambiarVisibilidadParams) error {
			return fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica"})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── AgregarVideoPlaylist ────────────────────────────────

func TestAgregarVideoPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		agregarVideoPlaylistFn: func(params types.AgregarVideoParams) (int32, error) {
			return 5, nil
		},
	}
	classRepo := &mockClassRepoForPlaylist{
		buscarClaseGrabadaFn: func(idClase int32) (types.ClaseGrabada, error) {
			return types.ClaseGrabada{ID: 10}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, classRepo)
	id, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 5 {
		t.Fatalf("esperaba id=5, obtuvo %d", id)
	}
}

func TestAgregarVideoPlaylist_IDPlaylistInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 0, IDClase: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_IDClaseInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 0})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_TiempoInicioNegativo(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	neg := int32(-1)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10, TiempoInicio: &neg})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_TiempoFinalNegativo(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	neg := int32(-1)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10, TiempoFinal: &neg})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_TiempoFinalMenorIgualInicio(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	inicio := int32(100)
	final := int32(50)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10, TiempoInicio: &inicio, TiempoFinal: &final})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_TiempoFinalIgualInicio(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	inicio := int32(100)
	final := int32(100)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10, TiempoInicio: &inicio, TiempoFinal: &final})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_ClaseNoEncontrada(t *testing.T) {
	classRepo := &mockClassRepoForPlaylist{
		buscarClaseGrabadaFn: func(idClase int32) (types.ClaseGrabada, error) {
			return types.ClaseGrabada{}, sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(&mockPlaylistRepo{}, classRepo)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
	var appErr *types.AppError
	if !errors.As(err, &appErr) || appErr.Code != types.CodeNotFound {
		t.Errorf("esperaba NOT_FOUND, obtuvo: %v", err)
	}
}

func TestAgregarVideoPlaylist_ClaseErrorInterno(t *testing.T) {
	classRepo := &mockClassRepoForPlaylist{
		buscarClaseGrabadaFn: func(idClase int32) (types.ClaseGrabada, error) {
			return types.ClaseGrabada{}, fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(&mockPlaylistRepo{}, classRepo)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestAgregarVideoPlaylist_ErrorRepositorio(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		agregarVideoPlaylistFn: func(params types.AgregarVideoParams) (int32, error) {
			return 0, fmt.Errorf("db error")
		},
	}
	classRepo := &mockClassRepoForPlaylist{
		buscarClaseGrabadaFn: func(idClase int32) (types.ClaseGrabada, error) {
			return types.ClaseGrabada{}, nil
		},
	}
	svc := NewPlaylistService(playlistRepo, classRepo)
	_, err := svc.AgregarVideoPlaylist(types.AgregarVideoParams{IDPlaylist: 1, IDClase: 10})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── EliminarVideoPlaylist ───────────────────────────────

func TestEliminarVideoPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarVideoPlaylistFn: func(idPlaylistClases, idUsuario int32) error {
			return nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarVideoPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestEliminarVideoPlaylist_IDInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.EliminarVideoPlaylist(0, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarVideoPlaylist_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	err := svc.EliminarVideoPlaylist(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarVideoPlaylist_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarVideoPlaylistFn: func(idPlaylistClases, idUsuario int32) error {
			return sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarVideoPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestEliminarVideoPlaylist_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		eliminarVideoPlaylistFn: func(idPlaylistClases, idUsuario int32) error {
			return fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	err := svc.EliminarVideoPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── GenerarLinkPlaylist ─────────────────────────────────

func TestGenerarLinkPlaylist_Exito(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		generarLinkPlaylistFn: func(idPlaylist, idUsuario int32) (string, error) {
			if idPlaylist != 1 || idUsuario != 10 {
				t.Errorf("parámetros inesperados")
			}
			return "abc123", nil
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	token, err := svc.GenerarLinkPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if token != "abc123" {
		t.Errorf("esperaba 'abc123', obtuvo '%s'", token)
	}
}

func TestGenerarLinkPlaylist_IDPlaylistInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.GenerarLinkPlaylist(0, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestGenerarLinkPlaylist_IDUsuarioInvalido(t *testing.T) {
	svc := NewPlaylistService(&mockPlaylistRepo{}, &mockClassRepoForPlaylist{})
	_, err := svc.GenerarLinkPlaylist(1, 0)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestGenerarLinkPlaylist_NoEncontrado(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		generarLinkPlaylistFn: func(idPlaylist, idUsuario int32) (string, error) {
			return "", sql.ErrNoRows
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.GenerarLinkPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestGenerarLinkPlaylist_ErrorInterno(t *testing.T) {
	playlistRepo := &mockPlaylistRepo{
		generarLinkPlaylistFn: func(idPlaylist, idUsuario int32) (string, error) {
			return "", fmt.Errorf("db error")
		},
	}
	svc := NewPlaylistService(playlistRepo, &mockClassRepoForPlaylist{})
	_, err := svc.GenerarLinkPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}
