package controller

import (
	"context"

	pb "servicio-grabaciones/proto/grabaciones"
	"servicio-grabaciones/services"
	"servicio-grabaciones/types"
)

type PlaylistController struct {
	playlistService services.PlaylistService
}

func NewPlaylistController(playlistService services.PlaylistService) *PlaylistController {
	return &PlaylistController{playlistService: playlistService}
}

func (c *PlaylistController) ConsultarPlaylistsUsuario(ctx context.Context, req *pb.ConsultarPlaylistsUsuarioRequest) (*pb.ConsultarPlaylistsUsuarioResponse, error) {
	result, err := c.playlistService.ConsultarPlaylistsUsuario(types.ConsultarPlaylistsParams{
		IDUsuario:  req.GetIdUsuario(),
		Pagina:     req.GetPagina(),
		OrdenarPor: req.GetOrdenarPor(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	playlists := make([]*pb.Playlist, 0, len(result.Playlists))
	for _, p := range result.Playlists {
		playlists = append(playlists, mapPlaylist(p))
	}

	return &pb.ConsultarPlaylistsUsuarioResponse{
		Exito:       true,
		Mensaje:     "Playlists consultadas exitosamente",
		Playlists:   playlists,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *PlaylistController) ConsultarPlaylistPorHash(ctx context.Context, req *pb.ConsultarPlaylistPorHashRequest) (*pb.ConsultarPlaylistPorHashResponse, error) {
	playlist, err := c.playlistService.ConsultarPlaylistPorHash(req.GetShareToken())
	if err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.ConsultarPlaylistPorHashResponse{
		Exito:    true,
		Mensaje:  "Playlist consultada exitosamente",
		Playlist: mapPlaylist(playlist),
	}, nil
}

func (c *PlaylistController) ConsultarVideosPlaylist(ctx context.Context, req *pb.ConsultarVideosPlaylistRequest) (*pb.ConsultarVideosPlaylistResponse, error) {
	result, err := c.playlistService.ConsultarVideosPlaylist(types.ConsultarVideosPlaylistParams{
		IDPlaylist: req.GetIdPlaylist(),
		Pagina:     req.GetPagina(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	videos := make([]*pb.VideoPlaylist, 0, len(result.Videos))
	for _, v := range result.Videos {
		videos = append(videos, mapVideoPlaylist(v))
	}

	return &pb.ConsultarVideosPlaylistResponse{
		Exito:       true,
		Mensaje:     "Videos consultados exitosamente",
		Videos:      videos,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *PlaylistController) ConsultarVideosPlaylistPorHash(ctx context.Context, req *pb.ConsultarVideosPlaylistPorHashRequest) (*pb.ConsultarVideosPlaylistPorHashResponse, error) {
	playlist, result, err := c.playlistService.ConsultarVideosPlaylistPorHash(req.GetShareToken(), req.GetPagina())
	if err != nil {
		return nil, toGrpcError(err)
	}

	videos := make([]*pb.VideoPlaylist, 0, len(result.Videos))
	for _, v := range result.Videos {
		videos = append(videos, mapVideoPlaylist(v))
	}

	return &pb.ConsultarVideosPlaylistPorHashResponse{
		Exito:       true,
		Mensaje:     "Videos consultados exitosamente",
		Playlist:    mapPlaylist(playlist),
		Videos:      videos,
		TotalPaginas: result.TotalPaginas,
	}, nil
}

func (c *PlaylistController) CrearPlaylist(ctx context.Context, req *pb.CrearPlaylistRequest) (*pb.CrearPlaylistResponse, error) {
	id, err := c.playlistService.CrearPlaylist(types.CrearPlaylistParams{
		IDUsuario:   req.GetIdUsuario(),
		Titulo:      req.GetTitulo(),
		Descripcion: req.GetDescripcion(),
		Visibilidad: req.GetVisibilidad(),
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.CrearPlaylistResponse{
		Exito:      true,
		Mensaje:    "Playlist creada exitosamente",
		IdPlaylist: id,
	}, nil
}

func (c *PlaylistController) EliminarPlaylist(ctx context.Context, req *pb.EliminarPlaylistRequest) (*pb.EliminarPlaylistResponse, error) {
	if err := c.playlistService.EliminarPlaylist(req.GetIdPlaylist(), req.GetIdUsuario()); err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.EliminarPlaylistResponse{
		Exito:   true,
		Mensaje: "Playlist eliminada exitosamente",
	}, nil
}

func (c *PlaylistController) CambiarVisibilidadPlaylist(ctx context.Context, req *pb.CambiarVisibilidadPlaylistRequest) (*pb.CambiarVisibilidadPlaylistResponse, error) {
	if err := c.playlistService.CambiarVisibilidadPlaylist(types.CambiarVisibilidadParams{
		IDPlaylist:  req.GetIdPlaylist(),
		IDUsuario:   req.GetIdUsuario(),
		Visibilidad: req.GetVisibilidad(),
	}); err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.CambiarVisibilidadPlaylistResponse{
		Exito:   true,
		Mensaje: "Visibilidad actualizada exitosamente",
	}, nil
}

func (c *PlaylistController) AgregarVideoPlaylist(ctx context.Context, req *pb.AgregarVideoPlaylistRequest) (*pb.AgregarVideoPlaylistResponse, error) {
	id, err := c.playlistService.AgregarVideoPlaylist(types.AgregarVideoParams{
		IDPlaylist:   req.GetIdPlaylist(),
		IDClase:      req.GetIdClase(),
		TiempoInicio: req.TiempoInicio,
		TiempoFinal:  req.TiempoFinal,
	})
	if err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.AgregarVideoPlaylistResponse{
		Exito:            true,
		Mensaje:          "Video agregado a la playlist exitosamente",
		IdPlaylistClases: id,
	}, nil
}

func (c *PlaylistController) EliminarVideoPlaylist(ctx context.Context, req *pb.EliminarVideoPlaylistRequest) (*pb.EliminarVideoPlaylistResponse, error) {
	if err := c.playlistService.EliminarVideoPlaylist(req.GetIdPlaylistClases(), req.GetIdUsuario()); err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.EliminarVideoPlaylistResponse{
		Exito:   true,
		Mensaje: "Video eliminado de la playlist exitosamente",
	}, nil
}

func (c *PlaylistController) GenerarLinkPlaylist(ctx context.Context, req *pb.GenerarLinkPlaylistRequest) (*pb.GenerarLinkPlaylistResponse, error) {
	token, err := c.playlistService.GenerarLinkPlaylist(req.GetIdPlaylist(), req.GetIdUsuario())
	if err != nil {
		return nil, toGrpcError(err)
	}

	return &pb.GenerarLinkPlaylistResponse{
		Exito:      true,
		Mensaje:    "Link generado exitosamente",
		ShareToken: token,
	}, nil
}

func mapPlaylist(p types.Playlist) *pb.Playlist {
	return &pb.Playlist{
		IdPlaylist:     p.ID,
		IdUsuario:      p.IDUsuario,
		Titulo:         p.Titulo,
		Descripcion:    p.Descripcion,
		Visibilidad:    p.Visibilidad,
		ShareToken:     p.ShareToken,
		FechaCreacion:  p.FechaCreacion,
		CantidadVideos: p.CantidadVideos,
	}
}

func mapVideoPlaylist(v types.VideoPlaylist) *pb.VideoPlaylist {
	return &pb.VideoPlaylist{
		IdPlaylistClases: v.IDPlaylistClases,
		IdPlaylist:       v.IDPlaylist,
		IdClase:          v.IDClase,
		TiempoInicio:     v.TiempoInicio,
		TiempoFinal:      v.TiempoFinal,
		FechaCreacion:    v.FechaCreacion,
		TituloClase:      v.TituloClase,
		UrlVideo:         v.URLVideo,
		DuracionMin:      v.DuracionMin,
	}
}
