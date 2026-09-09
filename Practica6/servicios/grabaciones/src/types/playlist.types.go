package types

type Playlist struct {
	ID             int32  `json:"id_playlist"`
	IDUsuario      int32  `json:"id_usuario"`
	Titulo         string `json:"titulo"`
	Descripcion    string `json:"descripcion"`
	Visibilidad    string `json:"visibilidad"`
	ShareToken     string `json:"share_token"`
	FechaCreacion  string `json:"fecha_creacion"`
	CantidadVideos int32  `json:"cantidad_videos"`
}

type VideoPlaylist struct {
	IDPlaylistClases int32   `json:"id_playlist_clases"`
	IDPlaylist       int32   `json:"id_playlist"`
	IDClase          int32   `json:"id_clase"`
	TiempoInicio     *int32  `json:"tiempo_inicio"`
	TiempoFinal      *int32  `json:"tiempo_final"`
	FechaCreacion    string  `json:"fecha_creacion"`
	TituloClase      string  `json:"titulo_clase"`
	URLVideo         string  `json:"url_video"`
	DuracionMin      int32   `json:"duracion_min"`
}

type ConsultarPlaylistsParams struct {
	IDUsuario int32
	Pagina    int32
	OrdenarPor string
}

type ConsultarPlaylistsResult struct {
	Playlists   []Playlist
	TotalPaginas int32
}

type ConsultarVideosPlaylistParams struct {
	IDPlaylist int32
	Pagina     int32
}

type ConsultarVideosPlaylistResult struct {
	Videos      []VideoPlaylist
	TotalPaginas int32
}

type CrearPlaylistParams struct {
	IDUsuario   int32
	Titulo      string
	Descripcion string
	Visibilidad string
}

type CambiarVisibilidadParams struct {
	IDPlaylist  int32
	IDUsuario   int32
	Visibilidad string
}

type AgregarVideoParams struct {
	IDPlaylist  int32
	IDClase     int32
	TiempoInicio *int32
	TiempoFinal  *int32
}

type EliminarVideoParams struct {
	IDPlaylistClases int32
	IDUsuario        int32
}
