package types

type ClaseCargaInput struct {
	IDCurso        int32   `json:"id_curso"`
	IDPeriodo      int32   `json:"id_periodo"`
	IDArea         int32   `json:"id_area"`
	Titulo         string  `json:"titulo"`
	FechaImpartida string  `json:"fecha_impartida"`
	DuracionMin    int32   `json:"duracion_min"`
	Descripcion    *string `json:"descripcion,omitempty"`
	URLVideo       *string `json:"url_video,omitempty"`
	Anio           *int32  `json:"anio,omitempty"`
	NumSemestre    *int32  `json:"num_semestre,omitempty"`
}

type BatchCrearClaseResult struct {
	Index   int32   `json:"index"`
	Status  string  `json:"status"`
	Message *string `json:"message,omitempty"`
	IDClase *int32  `json:"id_clase,omitempty"`
}

type BatchCrearClaseResponse struct {
	Exito      bool                    `json:"exito"`
	Mensaje    string                  `json:"mensaje"`
	Resultados []BatchCrearClaseResult `json:"resultados"`
}
