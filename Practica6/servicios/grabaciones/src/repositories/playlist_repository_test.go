package repositories

import (
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"servicio-grabaciones/types"
)

func TestNewPostgresPlaylistRepository(t *testing.T) {
	db, _, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	if repo == nil {
		t.Fatal("esperaba repo no nil")
	}
}

// ─── ConsultarPlaylistsUsuario ───────────────────────────

func TestPlaylistRepo_ConsultarPlaylistsUsuario_ConResultados(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	playlistRows := sqlmock.NewRows([]string{"id_playlist", "id_usuario", "titulo", "descripciion", "visibilidad", "share_token", "fecha_creacion", "cantidad_videos"}).
		AddRow(1, 10, "Mi Playlist", "Desc", "Privada", "", "2025-01-15 10:00:00", 5)
	mock.ExpectQuery("SELECT").WillReturnRows(playlistRows)

	result, err := repo.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if result.TotalPaginas != 1 {
		t.Fatalf("esperaba 1 pagina, obtuvo %d", result.TotalPaginas)
	}
	if len(result.Playlists) != 1 {
		t.Fatalf("esperaba 1 playlist, obtuvo %d", len(result.Playlists))
	}
	if result.Playlists[0].Titulo != "Mi Playlist" {
		t.Errorf("esperaba titulo 'Mi Playlist', obtuvo '%s'", result.Playlists[0].Titulo)
	}
}

func TestPlaylistRepo_ConsultarPlaylistsUsuario_SinResultados(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(0)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	playlistRows := sqlmock.NewRows([]string{"id_playlist", "id_usuario", "titulo", "descripciion", "visibilidad", "share_token", "fecha_creacion", "cantidad_videos"})
	mock.ExpectQuery("SELECT").WillReturnRows(playlistRows)

	result, err := repo.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Playlists) != 0 {
		t.Fatalf("esperaba 0 playlists, obtuvo %d", len(result.Playlists))
	}
}

func TestPlaylistRepo_ConsultarPlaylistsUsuario_ErrorCount(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectQuery("SELECT CEIL").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_ConsultarPlaylistsUsuario_ErrorQuery(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{IDUsuario: 10, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarPlaylistPorHash ────────────────────────────

func TestPlaylistRepo_ConsultarPlaylistPorHash_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)

	playlistRows := sqlmock.NewRows([]string{"id_playlist", "id_usuario", "titulo", "descripciion", "visibilidad", "share_token", "fecha_creacion", "cantidad_videos"}).
		AddRow(1, 10, "Publica", "Desc", "Publica", "abc123", "2025-01-15 10:00:00", 3)
	mock.ExpectQuery("SELECT").WillReturnRows(playlistRows)

	p, err := repo.ConsultarPlaylistPorHash("abc123")
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if p.ID != 1 || p.Titulo != "Publica" {
		t.Errorf("datos inesperados: %+v", p)
	}
}

func TestPlaylistRepo_ConsultarPlaylistPorHash_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrNoRows)
	_, err := repo.ConsultarPlaylistPorHash("invalid")
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

// ─── ConsultarVideosPlaylist ─────────────────────────────

func TestPlaylistRepo_ConsultarVideosPlaylist_ConResultados(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	videoRows := sqlmock.NewRows([]string{"id_playlist_clases", "id_playlist", "id_clase", "tiempo_inicio", "tiempo_final", "fecha_creacion", "titulo", "url_video", "duracio_min"}).
		AddRow(1, 1, 10, int32Ptr(0), int32Ptr(300), "2025-01-15 10:00:00", "Clase 1", "https://video.test", 60)
	mock.ExpectQuery("SELECT").WillReturnRows(videoRows)

	result, err := repo.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: 1})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if len(result.Videos) != 1 {
		t.Fatalf("esperaba 1 video, obtuvo %d", len(result.Videos))
	}
	if result.Videos[0].TituloClase != "Clase 1" {
		t.Errorf("esperaba titulo 'Clase 1', obtuvo '%s'", result.Videos[0].TituloClase)
	}
}

func TestPlaylistRepo_ConsultarVideosPlaylist_ErrorCount(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectQuery("SELECT CEIL").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_ConsultarVideosPlaylist_ErrorQuery(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrConnDone)
	_, err := repo.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{IDPlaylist: 1, Pagina: 1})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── ConsultarVideosPlaylistPorHash ──────────────────────

func TestPlaylistRepo_ConsultarVideosPlaylistPorHash_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)

	playlistRows := sqlmock.NewRows([]string{"id_playlist", "id_usuario", "titulo", "descripciion", "visibilidad", "share_token", "fecha_creacion", "cantidad_videos"}).
		AddRow(1, 10, "Publica", "Desc", "Publica", "abc123", "2025-01-15 10:00:00", 1)
	mock.ExpectQuery("SELECT").WillReturnRows(playlistRows)

	countRows := sqlmock.NewRows([]string{"ceil"}).AddRow(1)
	mock.ExpectQuery("SELECT CEIL").WillReturnRows(countRows)

	videoRows := sqlmock.NewRows([]string{"id_playlist_clases", "id_playlist", "id_clase", "tiempo_inicio", "tiempo_final", "fecha_creacion", "titulo", "url_video", "duracio_min"}).
		AddRow(1, 1, 10, int32Ptr(0), int32Ptr(300), "2025-01-15 10:00:00", "Clase 1", "https://video.test", 60)
	mock.ExpectQuery("SELECT").WillReturnRows(videoRows)

	p, result, err := repo.ConsultarVideosPlaylistPorHash("abc123", 1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if p.ID != 1 {
		t.Errorf("esperaba ID=1, obtuvo %d", p.ID)
	}
	if len(result.Videos) != 1 {
		t.Errorf("esperaba 1 video, obtuvo %d", len(result.Videos))
	}
}

func TestPlaylistRepo_ConsultarVideosPlaylistPorHash_ErrorPlaylist(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrNoRows)
	_, _, err := repo.ConsultarVideosPlaylistPorHash("invalid", 1)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── CrearPlaylist ───────────────────────────────────────

func TestPlaylistRepo_CrearPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	rows := sqlmock.NewRows([]string{"id_playlist"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO playlist").WillReturnRows(rows)
	id, err := repo.CrearPlaylist(types.CrearPlaylistParams{
		IDUsuario: 10, Titulo: "Mi Playlist", Descripcion: "Desc", Visibilidad: "Privada",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

// ─── EliminarPlaylist ────────────────────────────────────

func TestPlaylistRepo_EliminarPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_EliminarPlaylist_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarPlaylist(999, 10)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_EliminarPlaylist_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist").WillReturnError(sql.ErrConnDone)
	err := repo.EliminarPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_EliminarPlaylist_ErrorRowsAffected(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist").WillReturnResult(sqlmock.NewErrorResult(sql.ErrConnDone))
	err := repo.EliminarPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── CambiarVisibilidadPlaylist ──────────────────────────

func TestPlaylistRepo_CambiarVisibilidadPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET visibilidad").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{
		IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica",
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_CambiarVisibilidadPlaylist_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET visibilidad").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{
		IDPlaylist: 999, IDUsuario: 10, Visibilidad: "Publica",
	})
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_CambiarVisibilidadPlaylist_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET visibilidad").WillReturnError(sql.ErrConnDone)
	err := repo.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{
		IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_CambiarVisibilidadPlaylist_ErrorRowsAffected(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET visibilidad").WillReturnResult(sqlmock.NewErrorResult(sql.ErrConnDone))
	err := repo.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{
		IDPlaylist: 1, IDUsuario: 10, Visibilidad: "Publica",
	})
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── AgregarVideoPlaylist ────────────────────────────────

func TestPlaylistRepo_AgregarVideoPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	rows := sqlmock.NewRows([]string{"id_playlist_clases"}).AddRow(1)
	mock.ExpectQuery("INSERT INTO playlist_clases").WillReturnRows(rows)
	id, err := repo.AgregarVideoPlaylist(types.AgregarVideoParams{
		IDPlaylist: 1, IDClase: 10, TiempoInicio: int32Ptr(0), TiempoFinal: int32Ptr(300),
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 1 {
		t.Fatalf("esperaba ID=1, obtuvo %d", id)
	}
}

func TestPlaylistRepo_AgregarVideoPlaylist_TiempoNil(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	rows := sqlmock.NewRows([]string{"id_playlist_clases"}).AddRow(2)
	mock.ExpectQuery("INSERT INTO playlist_clases").WillReturnRows(rows)
	id, err := repo.AgregarVideoPlaylist(types.AgregarVideoParams{
		IDPlaylist: 1, IDClase: 10,
	})
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if id != 2 {
		t.Fatalf("esperaba ID=2, obtuvo %d", id)
	}
}

// ─── EliminarVideoPlaylist ───────────────────────────────

func TestPlaylistRepo_EliminarVideoPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist_clases").WillReturnResult(sqlmock.NewResult(0, 1))
	err := repo.EliminarVideoPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_EliminarVideoPlaylist_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist_clases").WillReturnResult(sqlmock.NewResult(0, 0))
	err := repo.EliminarVideoPlaylist(999, 10)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_EliminarVideoPlaylist_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist_clases").WillReturnError(sql.ErrConnDone)
	err := repo.EliminarVideoPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_EliminarVideoPlaylist_ErrorRowsAffected(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("DELETE FROM playlist_clases").WillReturnResult(sqlmock.NewErrorResult(sql.ErrConnDone))
	err := repo.EliminarVideoPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── GenerarLinkPlaylist ─────────────────────────────────

func TestPlaylistRepo_GenerarLinkPlaylist_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET share_token").WillReturnResult(sqlmock.NewResult(0, 1))
	token, err := repo.GenerarLinkPlaylist(1, 10)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if token == "" {
		t.Fatal("esperaba token no vacío")
	}
	if len(token) != 32 {
		t.Errorf("esperaba token de 32 chars, obtuvo %d: %s", len(token), token)
	}
}

func TestPlaylistRepo_GenerarLinkPlaylist_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET share_token").WillReturnResult(sqlmock.NewResult(0, 0))
	_, err := repo.GenerarLinkPlaylist(999, 10)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

func TestPlaylistRepo_GenerarLinkPlaylist_ErrorExec(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET share_token").WillReturnError(sql.ErrConnDone)
	_, err := repo.GenerarLinkPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestPlaylistRepo_GenerarLinkPlaylist_ErrorRowsAffected(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectExec("UPDATE playlist SET share_token").WillReturnResult(sqlmock.NewErrorResult(sql.ErrConnDone))
	_, err := repo.GenerarLinkPlaylist(1, 10)
	if err == nil {
		t.Fatal("esperaba error")
	}
}

// ─── BuscarPlaylistPorID ─────────────────────────────────

func TestPlaylistRepo_BuscarPlaylistPorID_Exito(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	playlistRows := sqlmock.NewRows([]string{"id_playlist", "id_usuario", "titulo", "descripciion", "visibilidad", "share_token", "fecha_creacion", "cantidad_videos"}).
		AddRow(1, 10, "Playlist", "Desc", "Privada", "", "2025-01-15 10:00:00", 0)
	mock.ExpectQuery("SELECT").WillReturnRows(playlistRows)
	p, err := repo.BuscarPlaylistPorID(1)
	if err != nil {
		t.Fatalf("esperaba exito, obtuvo: %v", err)
	}
	if p.ID != 1 || p.Titulo != "Playlist" {
		t.Errorf("datos inesperados: %+v", p)
	}
}

func TestPlaylistRepo_BuscarPlaylistPorID_NoEncontrado(t *testing.T) {
	db, mock, _ := sqlmock.New()
	repo := NewPostgresPlaylistRepository(db)
	mock.ExpectQuery("SELECT").WillReturnError(sql.ErrNoRows)
	_, err := repo.BuscarPlaylistPorID(999)
	if err != sql.ErrNoRows {
		t.Fatalf("esperaba sql.ErrNoRows, obtuvo: %v", err)
	}
}

// ─── helpers ─────────────────────────────────────────────

func int32Ptr(v int32) *int32 {
	return &v
}
