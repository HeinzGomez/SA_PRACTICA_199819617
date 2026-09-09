package repositories

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"strings"

	"servicio-grabaciones/types"
)

type PlaylistRepository interface {
	ConsultarPlaylistsUsuario(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error)
	ConsultarPlaylistPorHash(shareToken string) (types.Playlist, error)
	ConsultarVideosPlaylist(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error)
	ConsultarVideosPlaylistPorHash(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error)
	CrearPlaylist(params types.CrearPlaylistParams) (int32, error)
	EliminarPlaylist(idPlaylist, idUsuario int32) error
	CambiarVisibilidadPlaylist(params types.CambiarVisibilidadParams) error
	AgregarVideoPlaylist(params types.AgregarVideoParams) (int32, error)
	EliminarVideoPlaylist(idPlaylistClases, idUsuario int32) error
	GenerarLinkPlaylist(idPlaylist, idUsuario int32) (string, error)
	BuscarPlaylistPorID(idPlaylist int32) (types.Playlist, error)
}

type PostgresPlaylistRepository struct {
	db *sql.DB
}

func NewPostgresPlaylistRepository(db *sql.DB) *PostgresPlaylistRepository {
	return &PostgresPlaylistRepository{db: db}
}

const playlistPageSize int32 = 10

func (r *PostgresPlaylistRepository) ConsultarPlaylistsUsuario(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
	var result types.ConsultarPlaylistsResult

	orderClause := "fecha_creacion DESC"
	switch strings.ToLower(params.OrdenarPor) {
	case "nombre":
		orderClause = "titulo ASC"
	case "cantidad_videos":
		orderClause = "cantidad_videos DESC"
	}

	var totalPaginas int32
	err := r.db.QueryRow(
		`SELECT CEIL(COUNT(*)::NUMERIC / $1) FROM playlist WHERE id_usuario = $2`,
		playlistPageSize, params.IDUsuario,
	).Scan(&totalPaginas)
	if err != nil {
		return result, err
	}

	offset := (params.Pagina - 1) * playlistPageSize
	query := fmt.Sprintf(`
		SELECT p.id_playlist, p.id_usuario, p.titulo, COALESCE(p.descripciion, ''),
		       COALESCE(p.visibilidad, 'Privada'), COALESCE(p.share_token, ''),
		       to_char(p.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS'),
		       (SELECT COUNT(*)::INT FROM playlist_clases pc WHERE pc.id_playlist = p.id_playlist)
		FROM playlist p
		WHERE p.id_usuario = $1
		ORDER BY %s
		LIMIT $2 OFFSET $3
	`, orderClause)

	rows, err := r.db.Query(query, params.IDUsuario, playlistPageSize, offset)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	playlists := make([]types.Playlist, 0)
	for rows.Next() {
		var p types.Playlist
		if err := rows.Scan(&p.ID, &p.IDUsuario, &p.Titulo, &p.Descripcion,
			&p.Visibilidad, &p.ShareToken, &p.FechaCreacion, &p.CantidadVideos); err != nil {
			return result, err
		}
		playlists = append(playlists, p)
	}
	if err := rows.Err(); err != nil {
		return result, err
	}

	result.Playlists = playlists
	result.TotalPaginas = totalPaginas
	return result, nil
}

func (r *PostgresPlaylistRepository) ConsultarPlaylistPorHash(shareToken string) (types.Playlist, error) {
	var p types.Playlist
	err := r.db.QueryRow(
		`SELECT p.id_playlist, p.id_usuario, p.titulo, COALESCE(p.descripciion, ''),
		        COALESCE(p.visibilidad, 'Privada'), COALESCE(p.share_token, ''),
		        to_char(p.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS'),
		        (SELECT COUNT(*)::INT FROM playlist_clases pc WHERE pc.id_playlist = p.id_playlist)
		 FROM playlist p
		 WHERE p.share_token = $1 AND p.visibilidad = 'Publica'`,
		shareToken,
	).Scan(&p.ID, &p.IDUsuario, &p.Titulo, &p.Descripcion,
		&p.Visibilidad, &p.ShareToken, &p.FechaCreacion, &p.CantidadVideos)
	return p, err
}

func (r *PostgresPlaylistRepository) ConsultarVideosPlaylist(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
	var result types.ConsultarVideosPlaylistResult

	var totalPaginas int32
	err := r.db.QueryRow(
		`SELECT CEIL(COUNT(*)::NUMERIC / $1) FROM playlist_clases WHERE id_playlist = $2`,
		playlistPageSize, params.IDPlaylist,
	).Scan(&totalPaginas)
	if err != nil {
		return result, err
	}

	offset := (params.Pagina - 1) * playlistPageSize
	rows, err := r.db.Query(
		`SELECT pc.id_playlist_clases, pc.id_playlist, pc.id_clase,
		        pc.tiempo_inicio, pc.tiempo_final,
		        to_char(pc.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS'),
		        cg.titulo, cg.url_video, cg.duracio_min
		 FROM playlist_clases pc
		 JOIN clase_grabada cg ON cg.id_clase = pc.id_clase
		 WHERE pc.id_playlist = $1
		 ORDER BY pc.fecha_creacion
		 LIMIT $2 OFFSET $3`,
		params.IDPlaylist, playlistPageSize, offset,
	)
	if err != nil {
		return result, err
	}
	defer rows.Close()

	videos := make([]types.VideoPlaylist, 0)
	for rows.Next() {
		var v types.VideoPlaylist
		if err := rows.Scan(&v.IDPlaylistClases, &v.IDPlaylist, &v.IDClase,
			&v.TiempoInicio, &v.TiempoFinal, &v.FechaCreacion,
			&v.TituloClase, &v.URLVideo, &v.DuracionMin); err != nil {
			return result, err
		}
		videos = append(videos, v)
	}
	if err := rows.Err(); err != nil {
		return result, err
	}

	result.Videos = videos
	result.TotalPaginas = totalPaginas
	return result, nil
}

func (r *PostgresPlaylistRepository) ConsultarVideosPlaylistPorHash(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
	playlist, err := r.ConsultarPlaylistPorHash(shareToken)
	if err != nil {
		return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, err
	}

	result, err := r.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{
		IDPlaylist: playlist.ID,
		Pagina:     pagina,
	})
	return playlist, result, err
}

func (r *PostgresPlaylistRepository) CrearPlaylist(params types.CrearPlaylistParams) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO playlist (id_usuario, titulo, descripciion, visibilidad)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id_playlist`,
		params.IDUsuario, params.Titulo, params.Descripcion, params.Visibilidad,
	).Scan(&id)
	return id, err
}

func (r *PostgresPlaylistRepository) EliminarPlaylist(idPlaylist, idUsuario int32) error {
	result, err := r.db.Exec(
		`DELETE FROM playlist WHERE id_playlist = $1 AND id_usuario = $2`,
		idPlaylist, idUsuario,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PostgresPlaylistRepository) CambiarVisibilidadPlaylist(params types.CambiarVisibilidadParams) error {
	result, err := r.db.Exec(
		`UPDATE playlist SET visibilidad = $1
		 WHERE id_playlist = $2 AND id_usuario = $3`,
		params.Visibilidad, params.IDPlaylist, params.IDUsuario,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PostgresPlaylistRepository) AgregarVideoPlaylist(params types.AgregarVideoParams) (int32, error) {
	var id int32
	err := r.db.QueryRow(
		`INSERT INTO playlist_clases (id_playlist, id_clase, tiempo_inicio, tiempo_final)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id_playlist_clases`,
		params.IDPlaylist, params.IDClase, params.TiempoInicio, params.TiempoFinal,
	).Scan(&id)
	return id, err
}

func (r *PostgresPlaylistRepository) EliminarVideoPlaylist(idPlaylistClases, idUsuario int32) error {
	result, err := r.db.Exec(
		`DELETE FROM playlist_clases
		 WHERE id_playlist_clases = $1
		   AND id_playlist IN (SELECT id_playlist FROM playlist WHERE id_usuario = $2)`,
		idPlaylistClases, idUsuario,
	)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PostgresPlaylistRepository) GenerarLinkPlaylist(idPlaylist, idUsuario int32) (string, error) {
	token, err := generateShareToken()
	if err != nil {
		return "", err
	}

	result, err := r.db.Exec(
		`UPDATE playlist SET share_token = $1, visibilidad = 'Publica'
		 WHERE id_playlist = $2 AND id_usuario = $3`,
		token, idPlaylist, idUsuario,
	)
	if err != nil {
		return "", err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return "", err
	}
	if affected == 0 {
		return "", sql.ErrNoRows
	}
	return token, nil
}

func (r *PostgresPlaylistRepository) BuscarPlaylistPorID(idPlaylist int32) (types.Playlist, error) {
	var p types.Playlist
	err := r.db.QueryRow(
		`SELECT p.id_playlist, p.id_usuario, p.titulo, COALESCE(p.descripciion, ''),
		        COALESCE(p.visibilidad, 'Privada'), COALESCE(p.share_token, ''),
		        to_char(p.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS'),
		        (SELECT COUNT(*)::INT FROM playlist_clases pc WHERE pc.id_playlist = p.id_playlist)
		 FROM playlist p
		 WHERE p.id_playlist = $1`,
		idPlaylist,
	).Scan(&p.ID, &p.IDUsuario, &p.Titulo, &p.Descripcion,
		&p.Visibilidad, &p.ShareToken, &p.FechaCreacion, &p.CantidadVideos)
	return p, err
}

func generateShareToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
