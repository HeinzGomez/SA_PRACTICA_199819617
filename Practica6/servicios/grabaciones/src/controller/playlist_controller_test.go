package controller

import (
	"context"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

// ─── Mock PlaylistService ────────────────────────────────

type mockPlaylistService struct {
	consultarPlaylistsUsuarioFn       func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error)
	consultarPlaylistPorHashFn        func(shareToken string) (types.Playlist, error)
	consultarVideosPlaylistFn         func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error)
	consultarVideosPlaylistPorHashFn  func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error)
	crearPlaylistFn                   func(params types.CrearPlaylistParams) (int32, error)
	eliminarPlaylistFn                func(idPlaylist, idUsuario int32) error
	cambiarVisibilidadPlaylistFn      func(params types.CambiarVisibilidadParams) error
	agregarVideoPlaylistFn            func(params types.AgregarVideoParams) (int32, error)
	eliminarVideoPlaylistFn           func(idPlaylistClases, idUsuario int32) error
	generarLinkPlaylistFn             func(idPlaylist, idUsuario int32) (string, error)
}

var _ services.PlaylistService = (*mockPlaylistService)(nil)

func (m *mockPlaylistService) ConsultarPlaylistsUsuario(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
	if m.consultarPlaylistsUsuarioFn != nil {
		return m.consultarPlaylistsUsuarioFn(params)
	}
	return types.ConsultarPlaylistsResult{}, nil
}
func (m *mockPlaylistService) ConsultarPlaylistPorHash(shareToken string) (types.Playlist, error) {
	if m.consultarPlaylistPorHashFn != nil {
		return m.consultarPlaylistPorHashFn(shareToken)
	}
	return types.Playlist{}, nil
}
func (m *mockPlaylistService) ConsultarVideosPlaylist(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
	if m.consultarVideosPlaylistFn != nil {
		return m.consultarVideosPlaylistFn(params)
	}
	return types.ConsultarVideosPlaylistResult{}, nil
}
func (m *mockPlaylistService) ConsultarVideosPlaylistPorHash(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
	if m.consultarVideosPlaylistPorHashFn != nil {
		return m.consultarVideosPlaylistPorHashFn(shareToken, pagina)
	}
	return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, nil
}
func (m *mockPlaylistService) CrearPlaylist(params types.CrearPlaylistParams) (int32, error) {
	if m.crearPlaylistFn != nil {
		return m.crearPlaylistFn(params)
	}
	return 1, nil
}
func (m *mockPlaylistService) EliminarPlaylist(idPlaylist, idUsuario int32) error {
	if m.eliminarPlaylistFn != nil {
		return m.eliminarPlaylistFn(idPlaylist, idUsuario)
	}
	return nil
}
func (m *mockPlaylistService) CambiarVisibilidadPlaylist(params types.CambiarVisibilidadParams) error {
	if m.cambiarVisibilidadPlaylistFn != nil {
		return m.cambiarVisibilidadPlaylistFn(params)
	}
	return nil
}
func (m *mockPlaylistService) AgregarVideoPlaylist(params types.AgregarVideoParams) (int32, error) {
	if m.agregarVideoPlaylistFn != nil {
		return m.agregarVideoPlaylistFn(params)
	}
	return 1, nil
}
func (m *mockPlaylistService) EliminarVideoPlaylist(idPlaylistClases, idUsuario int32) error {
	if m.eliminarVideoPlaylistFn != nil {
		return m.eliminarVideoPlaylistFn(idPlaylistClases, idUsuario)
	}
	return nil
}
func (m *mockPlaylistService) GenerarLinkPlaylist(idPlaylist, idUsuario int32) (string, error) {
	if m.generarLinkPlaylistFn != nil {
		return m.generarLinkPlaylistFn(idPlaylist, idUsuario)
	}
	return "token", nil
}

// ─── ConsultarPlaylistsUsuario ───────────────────────────

func TestPlaylistCtrl_ConsultarPlaylistsUsuario_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		consultarPlaylistsUsuarioFn: func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
			return types.ConsultarPlaylistsResult{
				Playlists: []types.Playlist{
					{ID: 1, Titulo: "P1"},
					{ID: 2, Titulo: "P2"},
				},
				TotalPaginas: 1,
			}, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.ConsultarPlaylistsUsuario(context.Background(), &pb.ConsultarPlaylistsUsuarioRequest{
		IdUsuario: 10, Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
	if len(resp.Playlists) != 2 {
		t.Errorf("esperaba 2 playlists, obtuvo %d", len(resp.Playlists))
	}
	if resp.TotalPaginas != 1 {
		t.Errorf("esperaba 1 pagina, obtuvo %d", resp.TotalPaginas)
	}
}

func TestPlaylistCtrl_ConsultarPlaylistsUsuario_Error(t *testing.T) {
	svc := &mockPlaylistService{
		consultarPlaylistsUsuarioFn: func(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
			return types.ConsultarPlaylistsResult{}, types.NewInvalidArgumentError("id inválido")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.ConsultarPlaylistsUsuario(context.Background(), &pb.ConsultarPlaylistsUsuarioRequest{
		IdUsuario: 0,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── ConsultarPlaylistPorHash ────────────────────────────

func TestPlaylistCtrl_ConsultarPlaylistPorHash_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		consultarPlaylistPorHashFn: func(shareToken string) (types.Playlist, error) {
			return types.Playlist{ID: 1, Titulo: "Publica"}, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.ConsultarPlaylistPorHash(context.Background(), &pb.ConsultarPlaylistPorHashRequest{
		ShareToken: "abc123",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if resp.Playlist.Titulo != "Publica" {
		t.Errorf("esperaba titulo 'Publica', obtuvo '%s'", resp.Playlist.Titulo)
	}
}

func TestPlaylistCtrl_ConsultarPlaylistPorHash_Error(t *testing.T) {
	svc := &mockPlaylistService{
		consultarPlaylistPorHashFn: func(shareToken string) (types.Playlist, error) {
			return types.Playlist{}, types.NewNotFoundError("no encontrada")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.ConsultarPlaylistPorHash(context.Background(), &pb.ConsultarPlaylistPorHashRequest{
		ShareToken: "invalid",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.NotFound {
		t.Errorf("esperaba NotFound, obtuvo %v", st.Code())
	}
}

// ─── ConsultarVideosPlaylist ─────────────────────────────

func TestPlaylistCtrl_ConsultarVideosPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		consultarVideosPlaylistFn: func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
			return types.ConsultarVideosPlaylistResult{
				Videos: []types.VideoPlaylist{
					{IDPlaylistClases: 1, TituloClase: "Clase 1"},
				},
				TotalPaginas: 1,
			}, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.ConsultarVideosPlaylist(context.Background(), &pb.ConsultarVideosPlaylistRequest{
		IdPlaylist: 1, Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Videos) != 1 {
		t.Errorf("esperaba 1 video, obtuvo %d", len(resp.Videos))
	}
}

func TestPlaylistCtrl_ConsultarVideosPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		consultarVideosPlaylistFn: func(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
			return types.ConsultarVideosPlaylistResult{}, types.NewInternalError("db error")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.ConsultarVideosPlaylist(context.Background(), &pb.ConsultarVideosPlaylistRequest{
		IdPlaylist: 1,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarVideosPlaylistPorHash ──────────────────────

func TestPlaylistCtrl_ConsultarVideosPlaylistPorHash_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			return types.Playlist{ID: 1},
				types.ConsultarVideosPlaylistResult{
					Videos: []types.VideoPlaylist{{IDPlaylistClases: 1}},
				}, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.ConsultarVideosPlaylistPorHash(context.Background(), &pb.ConsultarVideosPlaylistPorHashRequest{
		ShareToken: "abc", Pagina: 1,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(resp.Videos) != 1 {
		t.Errorf("esperaba 1 video, obtuvo %d", len(resp.Videos))
	}
}

func TestPlaylistCtrl_ConsultarVideosPlaylistPorHash_Error(t *testing.T) {
	svc := &mockPlaylistService{
		consultarVideosPlaylistPorHashFn: func(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
			return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, types.NewInvalidArgumentError("token requerido")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.ConsultarVideosPlaylistPorHash(context.Background(), &pb.ConsultarVideosPlaylistPorHashRequest{
		ShareToken: "",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── CrearPlaylist ───────────────────────────────────────

func TestPlaylistCtrl_CrearPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		crearPlaylistFn: func(params types.CrearPlaylistParams) (int32, error) {
			return 10, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.CrearPlaylist(context.Background(), &pb.CrearPlaylistRequest{
		IdUsuario: 10, Titulo: "Mi Playlist", Visibilidad: "Privada",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if resp.IdPlaylist != 10 {
		t.Errorf("esperaba IdPlaylist=10, obtuvo %d", resp.IdPlaylist)
	}
}

func TestPlaylistCtrl_CrearPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		crearPlaylistFn: func(params types.CrearPlaylistParams) (int32, error) {
			return 0, types.NewInvalidArgumentError("título requerido")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.CrearPlaylist(context.Background(), &pb.CrearPlaylistRequest{
		IdUsuario: 10, Titulo: "",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.InvalidArgument {
		t.Errorf("esperaba InvalidArgument, obtuvo %v", st.Code())
	}
}

// ─── EliminarPlaylist ────────────────────────────────────

func TestPlaylistCtrl_EliminarPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		eliminarPlaylistFn: func(idPlaylist, idUsuario int32) error {
			return nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.EliminarPlaylist(context.Background(), &pb.EliminarPlaylistRequest{
		IdPlaylist: 1, IdUsuario: 10,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestPlaylistCtrl_EliminarPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		eliminarPlaylistFn: func(idPlaylist, idUsuario int32) error {
			return types.NewNotFoundError("no encontrada")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.EliminarPlaylist(context.Background(), &pb.EliminarPlaylistRequest{
		IdPlaylist: 999, IdUsuario: 10,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
	st, _ := status.FromError(err)
	if st.Code() != codes.NotFound {
		t.Errorf("esperaba NotFound, obtuvo %v", st.Code())
	}
}

// ─── CambiarVisibilidadPlaylist ──────────────────────────

func TestPlaylistCtrl_CambiarVisibilidadPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		cambiarVisibilidadPlaylistFn: func(params types.CambiarVisibilidadParams) error {
			return nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.CambiarVisibilidadPlaylist(context.Background(), &pb.CambiarVisibilidadPlaylistRequest{
		IdPlaylist: 1, IdUsuario: 10, Visibilidad: "Publica",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestPlaylistCtrl_CambiarVisibilidadPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		cambiarVisibilidadPlaylistFn: func(params types.CambiarVisibilidadParams) error {
			return types.NewInvalidArgumentError("visibilidad inválida")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.CambiarVisibilidadPlaylist(context.Background(), &pb.CambiarVisibilidadPlaylistRequest{
		IdPlaylist: 1, IdUsuario: 10, Visibilidad: "Otra",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── AgregarVideoPlaylist ────────────────────────────────

func TestPlaylistCtrl_AgregarVideoPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		agregarVideoPlaylistFn: func(params types.AgregarVideoParams) (int32, error) {
			return 5, nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.AgregarVideoPlaylist(context.Background(), &pb.AgregarVideoPlaylistRequest{
		IdPlaylist: 1, IdClase: 10,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if resp.IdPlaylistClases != 5 {
		t.Errorf("esperaba IdPlaylistClases=5, obtuvo %d", resp.IdPlaylistClases)
	}
}

func TestPlaylistCtrl_AgregarVideoPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		agregarVideoPlaylistFn: func(params types.AgregarVideoParams) (int32, error) {
			return 0, types.NewInternalError("db error")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.AgregarVideoPlaylist(context.Background(), &pb.AgregarVideoPlaylistRequest{
		IdPlaylist: 1, IdClase: 10,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── EliminarVideoPlaylist ───────────────────────────────

func TestPlaylistCtrl_EliminarVideoPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		eliminarVideoPlaylistFn: func(idPlaylistClases, idUsuario int32) error {
			return nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.EliminarVideoPlaylist(context.Background(), &pb.EliminarVideoPlaylistRequest{
		IdPlaylistClases: 1, IdUsuario: 10,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if !resp.Exito {
		t.Error("esperaba exito=true")
	}
}

func TestPlaylistCtrl_EliminarVideoPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		eliminarVideoPlaylistFn: func(idPlaylistClases, idUsuario int32) error {
			return types.NewNotFoundError("no encontrado")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.EliminarVideoPlaylist(context.Background(), &pb.EliminarVideoPlaylistRequest{
		IdPlaylistClases: 999, IdUsuario: 10,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── GenerarLinkPlaylist ─────────────────────────────────

func TestPlaylistCtrl_GenerarLinkPlaylist_Exito(t *testing.T) {
	svc := &mockPlaylistService{
		generarLinkPlaylistFn: func(idPlaylist, idUsuario int32) (string, error) {
			return "abc123", nil
		},
	}
	ctrl := NewPlaylistController(svc)
	resp, err := ctrl.GenerarLinkPlaylist(context.Background(), &pb.GenerarLinkPlaylistRequest{
		IdPlaylist: 1, IdUsuario: 10,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if resp.ShareToken != "abc123" {
		t.Errorf("esperaba token 'abc123', obtuvo '%s'", resp.ShareToken)
	}
}

func TestPlaylistCtrl_GenerarLinkPlaylist_Error(t *testing.T) {
	svc := &mockPlaylistService{
		generarLinkPlaylistFn: func(idPlaylist, idUsuario int32) (string, error) {
			return "", types.NewInternalError("error interno")
		},
	}
	ctrl := NewPlaylistController(svc)
	_, err := ctrl.GenerarLinkPlaylist(context.Background(), &pb.GenerarLinkPlaylistRequest{
		IdPlaylist: 1, IdUsuario: 10,
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}
