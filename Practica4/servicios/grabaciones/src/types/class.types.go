package types

type ClaseGrabada struct {
	ID             int32   `json:"id_clase"`
	IDCurso        int32   `json:"id_curso"`
	IDPeriodo      int32   `json:"id_periodo"`
	IDArea         int32   `json:"id_area"`
	Titulo         string  `json:"titulo"`
	FechaImpartida string  `json:"fecha_impartida"`
	DuracionMin    int32   `json:"duracion_min"`
	Descripcion    *string `json:"descripcion"`
	URLVideo       string  `json:"url_video"`
	Anio           int32   `json:"anio"`
	NumSemestre    int32   `json:"num_semestre"`
}

type CatalogoClase struct {
	ID             int32   `json:"id_clase"`
	Titulo         string  `json:"titulo"`
	Descripcion    *string `json:"descripcion"`
	FechaImpartida string  `json:"fecha_impartida"`
	DuracionMin    int32   `json:"duracion_min"`
	URLVideo       string  `json:"url_video"`
	Anio           int32   `json:"anio"`
	NumSemestre    int32   `json:"num_semestre"`
	IDCurso        int32   `json:"id_curso"`
	IDArea         int32   `json:"id_area"`
	IDPeriodo      int32   `json:"id_periodo"`
}

type ClaseBusqueda struct {
	ID             int32   `json:"id_clase"`
	Titulo         string  `json:"titulo"`
	Descripcion    *string `json:"descripcion"`
	FechaImpartida string  `json:"fecha_impartida"`
	DuracionMin    int32   `json:"duracion_min"`
	URLVideo       string  `json:"url_video"`
	Anio           int32   `json:"anio"`
	NumSemestre    int32   `json:"num_semestre"`
	IDCurso        int32   `json:"id_curso"`
	IDArea         int32   `json:"id_area"`
	IDPeriodo      int32   `json:"id_periodo"`
}

type FichaTecnicaRow struct {
	ClaseID        int32
	Titulo         string
	Descripcion    *string
	FechaImpartida string
	DuracionMin    int32
	URLVideo       string
	UnidadID       *int32
	Unidad         *string
	TemaID         *int32
	Tema           *string
	MaterialID     *int32
	Material       *string
	Tipo           *string
	MaterialURL    *string
}

type Participante struct {
	IDClase          int32  `json:"id_clase"`
	IDUsuario        int32  `json:"id_usuario"`
	TipoParticipante string `json:"tipo_participante"`
}

type DetalleClaseGrabada struct {
	Clase         ClaseGrabada    `json:"clase"`
	Temas         []Tema          `json:"temas"`
	Materiales    []MaterialApoyo `json:"materiales"`
	Participantes []Participante  `json:"participantes"`
}

type CrearClaseGrabadaParams struct {
	IDCurso        int32
	IDPeriodo      int32
	IDArea         int32
	Titulo         string
	FechaImpartida string
	DuracionMin    int32
	Descripcion    *string
	URLVideo       string
	Anio           int32
	NumSemestre    int32
}

type EditarClaseGrabadaParams struct {
	ID             int32
	IDCurso        int32
	IDPeriodo      int32
	IDArea         int32
	Titulo         string
	FechaImpartida string
	DuracionMin    int32
	Descripcion    *string
	URLVideo       string
	Anio           int32
	NumSemestre    int32
}

type BusquedaAvanzadaFiltros struct {
	Anio      int32
	Semestre  int32
	IDArea    int32
	IDCurso   int32
	IDDocente int32
	IDTema    int32
	Pagina    int32
}

type ConsultarCatalogoClasesParams struct {
	Pagina int32
}

type CatalogoClasesResult struct {
	Registros    []CatalogoClase
	TotalPaginas int32
}

type BusquedaAvanzadaResult struct {
	Registros    []ClaseBusqueda
	TotalPaginas int32
}
