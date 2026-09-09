package services

import (
	"database/sql"
	"strings"

	"servicio-grabaciones/repositories"
	"servicio-grabaciones/types"
)

type PlaylistService interface {
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
}

type PlaylistServiceImp struct {
	playlistRepo repositories.PlaylistRepository
	classRepo    repositories.ClassRepository
}

func NewPlaylistService(playlistRepo repositories.PlaylistRepository, classRepo repositories.ClassRepository) *PlaylistServiceImp {
	return &PlaylistServiceImp{playlistRepo: playlistRepo, classRepo: classRepo}
}

func (s *PlaylistServiceImp) ConsultarPlaylistsUsuario(params types.ConsultarPlaylistsParams) (types.ConsultarPlaylistsResult, error) {
	if params.IDUsuario <= 0 {
		return types.ConsultarPlaylistsResult{}, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if params.Pagina <= 0 {
		params.Pagina = 1
	}

	result, err := s.playlistRepo.ConsultarPlaylistsUsuario(params)
	if err != nil {
		return types.ConsultarPlaylistsResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}

func (s *PlaylistServiceImp) ConsultarPlaylistPorHash(shareToken string) (types.Playlist, error) {
	if strings.TrimSpace(shareToken) == "" {
		return types.Playlist{}, types.NewInvalidArgumentError("El token de compartir es obligatorio")
	}

	playlist, err := s.playlistRepo.ConsultarPlaylistPorHash(shareToken)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.Playlist{}, types.NewNotFoundError("Playlist no encontrada o no es pública")
		}
		return types.Playlist{}, types.NewInternalError(err.Error())
	}
	return playlist, nil
}

func (s *PlaylistServiceImp) ConsultarVideosPlaylist(params types.ConsultarVideosPlaylistParams) (types.ConsultarVideosPlaylistResult, error) {
	if params.IDPlaylist <= 0 {
		return types.ConsultarVideosPlaylistResult{}, types.NewInvalidArgumentError("El id de la playlist es obligatorio")
	}
	if params.Pagina <= 0 {
		params.Pagina = 1
	}

	result, err := s.playlistRepo.ConsultarVideosPlaylist(params)
	if err != nil {
		return types.ConsultarVideosPlaylistResult{}, types.NewInternalError(err.Error())
	}
	return result, nil
}

func (s *PlaylistServiceImp) ConsultarVideosPlaylistPorHash(shareToken string, pagina int32) (types.Playlist, types.ConsultarVideosPlaylistResult, error) {
	if strings.TrimSpace(shareToken) == "" {
		return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, types.NewInvalidArgumentError("El token de compartir es obligatorio")
	}
	if pagina <= 0 {
		pagina = 1
	}

	playlist, result, err := s.playlistRepo.ConsultarVideosPlaylistPorHash(shareToken, pagina)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, types.NewNotFoundError("Playlist no encontrada o no es pública")
		}
		return types.Playlist{}, types.ConsultarVideosPlaylistResult{}, types.NewInternalError(err.Error())
	}
	return playlist, result, nil
}

func (s *PlaylistServiceImp) CrearPlaylist(params types.CrearPlaylistParams) (int32, error) {
	if params.IDUsuario <= 0 {
		return 0, types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}
	if strings.TrimSpace(params.Titulo) == "" {
		return 0, types.NewInvalidArgumentError("El título es obligatorio")
	}

	visibilidad := strings.TrimSpace(params.Visibilidad)
	if visibilidad == "" {
		visibilidad = "Privada"
	}
	if visibilidad != "Privada" && visibilidad != "Publica" {
		return 0, types.NewInvalidArgumentError("La visibilidad debe ser 'Privada' o 'Publica'")
	}
	params.Visibilidad = visibilidad

	id, err := s.playlistRepo.CrearPlaylist(params)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *PlaylistServiceImp) EliminarPlaylist(idPlaylist, idUsuario int32) error {
	if idPlaylist <= 0 {
		return types.NewInvalidArgumentError("El id de la playlist es obligatorio")
	}
	if idUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	if err := s.playlistRepo.EliminarPlaylist(idPlaylist, idUsuario); err != nil {
		if err == sql.ErrNoRows {
			return types.NewNotFoundError("Playlist no encontrada o no pertenece al usuario")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *PlaylistServiceImp) CambiarVisibilidadPlaylist(params types.CambiarVisibilidadParams) error {
	if params.IDPlaylist <= 0 {
		return types.NewInvalidArgumentError("El id de la playlist es obligatorio")
	}
	if params.IDUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	visibilidad := strings.TrimSpace(params.Visibilidad)
	if visibilidad != "Privada" && visibilidad != "Publica" {
		return types.NewInvalidArgumentError("La visibilidad debe ser 'Privada' o 'Publica'")
	}
	params.Visibilidad = visibilidad

	if err := s.playlistRepo.CambiarVisibilidadPlaylist(params); err != nil {
		if err == sql.ErrNoRows {
			return types.NewNotFoundError("Playlist no encontrada o no pertenece al usuario")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *PlaylistServiceImp) AgregarVideoPlaylist(params types.AgregarVideoParams) (int32, error) {
	if params.IDPlaylist <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la playlist es obligatorio")
	}
	if params.IDClase <= 0 {
		return 0, types.NewInvalidArgumentError("El id de la clase es obligatorio")
	}
	if params.TiempoInicio != nil && *params.TiempoInicio < 0 {
		return 0, types.NewInvalidArgumentError("El tiempo de inicio no puede ser negativo")
	}
	if params.TiempoFinal != nil && *params.TiempoFinal < 0 {
		return 0, types.NewInvalidArgumentError("El tiempo final no puede ser negativo")
	}
	if params.TiempoInicio != nil && params.TiempoFinal != nil && *params.TiempoFinal <= *params.TiempoInicio {
		return 0, types.NewInvalidArgumentError("El tiempo final debe ser mayor al tiempo de inicio")
	}

	_, err := s.classRepo.BuscarClaseGrabada(params.IDClase)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, types.NewNotFoundError("La clase indicada no existe")
		}
		return 0, types.NewInternalError(err.Error())
	}

	id, err := s.playlistRepo.AgregarVideoPlaylist(params)
	if err != nil {
		return 0, types.NewInternalError(err.Error())
	}
	return id, nil
}

func (s *PlaylistServiceImp) EliminarVideoPlaylist(idPlaylistClases, idUsuario int32) error {
	if idPlaylistClases <= 0 {
		return types.NewInvalidArgumentError("El id del video en la playlist es obligatorio")
	}
	if idUsuario <= 0 {
		return types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	if err := s.playlistRepo.EliminarVideoPlaylist(idPlaylistClases, idUsuario); err != nil {
		if err == sql.ErrNoRows {
			return types.NewNotFoundError("Video no encontrado en la playlist o no pertenece al usuario")
		}
		return types.NewInternalError(err.Error())
	}
	return nil
}

func (s *PlaylistServiceImp) GenerarLinkPlaylist(idPlaylist, idUsuario int32) (string, error) {
	if idPlaylist <= 0 {
		return "", types.NewInvalidArgumentError("El id de la playlist es obligatorio")
	}
	if idUsuario <= 0 {
		return "", types.NewInvalidArgumentError("El id del usuario es obligatorio")
	}

	token, err := s.playlistRepo.GenerarLinkPlaylist(idPlaylist, idUsuario)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", types.NewNotFoundError("Playlist no encontrada o no pertenece al usuario")
		}
		return "", types.NewInternalError(err.Error())
	}
	return token, nil
}
