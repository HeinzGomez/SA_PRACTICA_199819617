package types

type AuditLog struct {
	IDAuditoria        int32   `json:"id_auditoria"`
	UsuarioResponsable int32   `json:"usuario_responsable"`
	Operacion          string  `json:"operacion"`
	TablaAfectada      string  `json:"tabla_afectada"`
	FechaEvento        string  `json:"fecha_evento"`
	EstadoAnterior     *string `json:"estado_anterior"`
	EstadoNuevo        *string `json:"estado_nuevo"`
}

type ConsultarAuditLogsParams struct {
	Pagina        int32
	UsuarioFiltro int32
	TablaFiltro   string
}

type ConsultarAuditLogsResult struct {
	Registros    []AuditLog
	TotalPaginas int32
}
