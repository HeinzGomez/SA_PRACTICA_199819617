package types

// HistorialReproduccion representa una fila de la tabla historial_reproduccion.
type HistorialReproduccion struct {
	IDHistorial             int32   `json:"id_historial"`
	IDUsuario               int32   `json:"id_usuario"`
	IDClase                 int32   `json:"id_clase"`
	IDTema                  int32   `json:"id_tema"`
	MinutoActual            int32   `json:"minuto_actual"`
	SegundoActual           int32   `json:"segundo_actual"`
	DuracionTotal           int32   `json:"duracion_total"`
	PorcentajeVisto         float64 `json:"porcentaje_visto"`
	FechaUltimaReproduccion string  `json:"fecha_ultima_reproduccion"`
	FechaCreacion           string  `json:"fecha_creacion"`
	FechaActualizacion      string  `json:"fecha_actualizacion"`
	Completada              bool    `json:"completada"`
}

// CheckpointClase representa el resultado de fn_obtener_checkpoint.
type CheckpointClase struct {
	IDTema                  int32   `json:"id_tema"`
	MinutoActual            int32   `json:"minuto_actual"`
	SegundoActual           int32   `json:"segundo_actual"`
	PorcentajeVisto         float64 `json:"porcentaje_visto"`
	Completada              bool    `json:"completada"`
	FechaUltimaReproduccion string  `json:"fecha_ultima_reproduccion"`
}

// EstadisticasUsuario es el resumen de progreso de un usuario.
type EstadisticasUsuario struct {
	TotalClases        int32   `json:"total_clases"`
	ClasesCompletadas  int32   `json:"clases_completadas"`
	PorcentajePromedio float64 `json:"porcentaje_promedio"`
	MinutosVistos      int32   `json:"minutos_vistos"`
}

// RegistrarProgresoParams es la entrada de sp_registrar_progreso.
type RegistrarProgresoParams struct {
	IDUsuario     int32
	IDClase       int32
	IDTema        int32
	MinutoActual  int32
	SegundoActual int32
	DuracionTotal int32
}

// ActualizarCheckpointParams es la entrada de sp_actualizar_checkpoint.
type ActualizarCheckpointParams struct {
	IDUsuario     int32
	IDClase       int32
	IDTema        int32
	MinutoActual  int32
	SegundoActual int32
}

// ConsultarHistorialParams define la paginación del historial de un usuario.
type ConsultarHistorialParams struct {
	IDUsuario int32
	Pagina    int32
}

// ConsultarHistorialResult agrupa registros y paginación.
type ConsultarHistorialResult struct {
	Registros    []HistorialReproduccion
	TotalPaginas int32
}

// EliminarHistorialParams identifica el registro a eliminar.
type EliminarHistorialParams struct {
	IDUsuario int32
	IDClase   int32
}
