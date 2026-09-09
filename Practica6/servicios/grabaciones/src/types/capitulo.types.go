// HeinzGomez - Nuevo dominio de capítulos: tipos para la segmentación de clases por bloques temáticos
package types

// Capitulo representa un bloque temático dentro de una clase grabada.
// El fin de un capítulo es el inicio del siguiente (modelo por marca de inicio).
type Capitulo struct {
	ID           int32  `json:"id_capitulo"`
	IDClase      int32  `json:"id_clase"`
	Titulo       string `json:"titulo"`
	TiempoInicio int32  `json:"tiempo_inicio"` // segundos desde el inicio del video
}

type CrearCapituloParams struct {
	IDClase      int32
	Titulo       string
	TiempoInicio int32
}

type EditarCapituloParams struct {
	ID           int32
	Titulo       string
	TiempoInicio int32
}
