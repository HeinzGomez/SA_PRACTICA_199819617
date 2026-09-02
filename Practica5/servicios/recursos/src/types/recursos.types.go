package types

type ArchivoRepositorio struct {
	IDArchivo int32  `json:"id_archivo"`
	Nombre    string `json:"nombre"`
}

type VersionArchivo struct {
	IDVersion      int32  `json:"id_version"`
	IDArchivo      int32  `json:"id_archivo"`
	Link           string `json:"link"`
	Tag            string `json:"tag"`
	FechaCreacion  string `json:"fecha_creacion"`
	Hash           string `json:"hash"`
	EsLatest       bool   `json:"latest"`
}

type RepositorioInfo struct {
	IDRepositorio int32                  `json:"id_repositorio"`
	IDClase       int32                  `json:"id_clase"`
	Nombre        string                 `json:"nombre"`
	Archivos      []ArchivoRepositorio   `json:"archivos"`
}

type CrearRepositorioParams struct {
	IDClase int32
	Nombre  string
}

type AgregarArchivoParams struct {
	IDRepositorio int32
	Nombre        string
	Link          string
	Tag           string
	Hash          string
}

type ActualizarVersionArchivoParams struct {
	IDArchivo int32
	Link      string
	Tag       string
	Hash      string
}

type ConsultarVersionArchivoParams struct {
	IDArchivo int32
	IDVersion int32
}

type MarcadorTiempo struct {
	IDMarcador int32  `json:"id_marcador"`
	Segundo    int32  `json:"segundo"`
	Texto      string `json:"texto"`
}

type ApunteInfo struct {
	IDApunte          int32              `json:"id_apunte"`
	IDClase           int32              `json:"id_clase"`
	IDUsuario         int32              `json:"id_usuario"`
	Titulo            string             `json:"titulo"`
	ContenidoMarkdown string             `json:"contenido_markdown"`
	FechaCreacion     string             `json:"fecha_creacion"`
	FechaActualizacion string            `json:"fecha_actualizacion"`
	Marcadores        []MarcadorTiempo   `json:"marcadores"`
}
