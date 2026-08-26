package types

type Unidad struct {
	ID          int32   `json:"id_unidad"`
	Nombre      string  `json:"nombre"`
	Descripcion *string `json:"descripcion"`
}

type Tema struct {
	ID          int32   `json:"id_tema"`
	UnidadID    int32   `json:"id_unidad"`
	Nombre      string  `json:"nombre"`
	Descripcion *string `json:"descripcion"`
	Unidad      *string `json:"unidad,omitempty"`
}

type CrearUnidadParams struct {
	Nombre      string
	Descripcion *string
}

type EditarUnidadParams struct {
	ID          int32
	Nombre      string
	Descripcion *string
}

type CrearTemaParams struct {
	UnidadID    int32
	Nombre      string
	Descripcion *string
}

type EditarTemaParams struct {
	ID          int32
	UnidadID    int32
	Nombre      string
	Descripcion *string
}
