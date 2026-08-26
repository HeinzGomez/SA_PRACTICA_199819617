package types

type MaterialApoyo struct {
	ID      int32  `json:"id_material"`
	IDClase int32  `json:"id_clase"`
	Nombre  string `json:"nombre"`
	Tipo    string `json:"tipo"`
	URL     string `json:"url"`
}

type AsignarDocenteParams struct {
	IDClase   int32
	IDUsuario int32
}

type AsignarAuxiliarParams struct {
	IDClase   int32
	IDUsuario int32
}

type AsignarMaterialApoyoParams struct {
	IDClase int32
	Nombre  string
	Tipo    string
	URL     string
}

type AsignarTemaClaseParams struct {
	IDClase int32
	IDTema  int32
}

type DesasignarDocenteParams struct {
	IDClase   int32
	IDUsuario int32
}

type DesasignarAuxiliarParams struct {
	IDClase   int32
	IDUsuario int32
}

type DesasignarMaterialApoyoParams struct {
	IDMaterial int32
}

type DesasignarTemaClaseParams struct {
	IDClase int32
	IDTema  int32
}
