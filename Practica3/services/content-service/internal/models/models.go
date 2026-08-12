package models

import "time"

// RecordingSummary representa una fila del catalogo de busqueda.
type RecordingSummary struct {
	RecordingID string
	Title       string
	CourseID    string
	Semester    string
	School      string
	RecordedAt  time.Time
	Tags        []string
}

// RecordingDetail es la ficha tecnica completa de una clase grabada.
type RecordingDetail struct {
	RecordingID string
	Title       string
	CourseID    string
	Semester    string
	School      string
	Unit        string
	SyllabusURL string
	VideoURL    string
	RecordedAt  time.Time
	Professors  []string
	Auxiliaries []string
	Tags        []string
}

// BulkIngestResult es el resultado agregado de sp_bulk_ingest_recordings_csv.
type BulkIngestResult struct {
	RowsProcessed int32
	RowsFailed    int32
	Errors        []string
}

// Checkpoint es el ultimo punto de avance guardado por un estudiante.
type Checkpoint struct {
	PositionSeconds int32
	Unit            string
	Topic           string
	UpdatedAt       time.Time
}

// HistoryItem es una entrada del historial de reproduccion reciente.
type HistoryItem struct {
	RecordingID     string
	Title           string
	CourseID        string
	Unit            string
	Topic           string
	PositionSeconds int32
	LastWatchedAt   time.Time
}
