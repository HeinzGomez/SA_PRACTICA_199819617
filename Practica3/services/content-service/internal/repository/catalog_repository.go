package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	"yousac/content-service/internal/models"
)

// MaxPageSize es el tope de paginacion exigido por el enunciado de la
// Practica 3: nunca se devuelven mas de 10 clases por pagina, incluso si
// el cliente solicita un page_size mayor.
const MaxPageSize = 10

type CatalogRepository struct {
	pool *pgxpool.Pool
}

func NewCatalogRepository(pool *pgxpool.Pool) *CatalogRepository {
	return &CatalogRepository{pool: pool}
}

// Search consulta la vista v_recording_catalog (ver db/init.sql) que ya
// resuelve el join entre grabaciones, docentes y etiquetas. La paginacion
// se aplica en el servidor (LIMIT/OFFSET) y el total refleja los MISMOS
// filtros aplicados a los resultados (no el total sin filtrar).
func (r *CatalogRepository) Search(ctx context.Context, semester, school, courseID, professorID, freeText string, page, pageSize int) ([]models.RecordingSummary, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}
	offset := (page - 1) * pageSize

	const whereClause = `
		WHERE ($1 = '' OR semester = $1)
		  AND ($2 = '' OR school = $2)
		  AND ($3 = '' OR course_id::text = $3)
		  AND ($4 = '' OR professor_id::text = $4)
		  AND ($5 = '' OR title ILIKE '%' || $5 || '%')
	`

	rows, err := r.pool.Query(ctx, `
		SELECT recording_id, title, course_id, semester, school, recorded_at, tags
		FROM v_recording_catalog
		`+whereClause+`
		ORDER BY recorded_at DESC
		LIMIT $6 OFFSET $7
	`, semester, school, courseID, professorID, freeText, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var results []models.RecordingSummary
	for rows.Next() {
		var rec models.RecordingSummary
		var schoolVal *string
		if err := rows.Scan(&rec.RecordingID, &rec.Title, &rec.CourseID, &rec.Semester, &schoolVal, &rec.RecordedAt, &rec.Tags); err != nil {
			return nil, 0, err
		}
		if schoolVal != nil {
			rec.School = *schoolVal
		}
		results = append(results, rec)
	}

	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT count(*) FROM v_recording_catalog
		`+whereClause, semester, school, courseID, professorID, freeText,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

func (r *CatalogRepository) GetDetail(ctx context.Context, recordingID string) (*models.RecordingDetail, error) {
	var d models.RecordingDetail
	var schoolVal *string
	err := r.pool.QueryRow(ctx, `
		SELECT recording_id, title, course_id, semester, school, unit, syllabus_url, video_url,
		       recorded_at, professors, auxiliaries, tags
		FROM v_recording_detail WHERE recording_id = $1
	`, recordingID).Scan(
		&d.RecordingID, &d.Title, &d.CourseID, &d.Semester, &schoolVal, &d.Unit, &d.SyllabusURL, &d.VideoURL,
		&d.RecordedAt, &d.Professors, &d.Auxiliaries, &d.Tags,
	)
	if err != nil {
		return nil, err
	}
	if schoolVal != nil {
		d.School = *schoolVal
	}
	return &d, nil
}

// Ingest invoca el procedimiento almacenado sp_ingest_recording, que crea la
// grabacion, sus relaciones con docentes/etiquetas y dispara la notificacion
// de "nueva clase publicada" (via el evento consumido por analytics-service).
func (r *CatalogRepository) Ingest(ctx context.Context, title, courseID, semester, unit, videoURL, school string, professors, tags []string) (string, error) {
	var recordingID string
	err := r.pool.QueryRow(ctx,
		`SELECT sp_ingest_recording($1, $2, $3, $4, $5, $6, $7, $8)`,
		title, courseID, semester, unit, videoURL, professors, tags, school,
	).Scan(&recordingID)
	return recordingID, err
}

// CsvRow es la fila intermedia parseada del archivo CSV, serializada a
// JSONB y enviada de una sola vez al procedimiento almacenado
// sp_bulk_ingest_recordings_csv (Practica 3), que hace la insercion
// masiva transaccional (fila por fila, con aislamiento de errores) del
// lado de la base de datos.
type CsvRow struct {
	Title       string   `json:"title"`
	CourseID    string   `json:"course_id"`
	Semester    string   `json:"semester"`
	School      string   `json:"school"`
	Unit        string   `json:"unit"`
	VideoURL    string   `json:"video_url"`
	Professors  []string `json:"professors"`
	Tags        []string `json:"tags"`
}

// BulkIngestCsv envia el lote completo de filas ya parseadas (ver
// internal/csvparser) al SP sp_bulk_ingest_recordings_csv en una sola
// invocacion, y registra la carga en csv_ingest_log para trazabilidad.
func (r *CatalogRepository) BulkIngestCsv(ctx context.Context, actorUserID string, rows []CsvRow) (*models.BulkIngestResult, error) {
	payload, err := json.Marshal(rows)
	if err != nil {
		return nil, err
	}

	var result models.BulkIngestResult
	err = r.pool.QueryRow(ctx,
		`SELECT (sp_bulk_ingest_recordings_csv($1::jsonb)).*`,
		string(payload),
	).Scan(&result.RowsProcessed, &result.RowsFailed, &result.Errors)
	if err != nil {
		return nil, err
	}

	_, logErr := r.pool.Exec(ctx,
		`INSERT INTO csv_ingest_log (actor_user_id, rows_processed, rows_failed) VALUES ($1, $2, $3)`,
		nullableUUID(actorUserID), result.RowsProcessed, result.RowsFailed,
	)
	if logErr != nil {
		// La bitacora es informativa; no debe abortar una carga que ya
		// se proceso correctamente en la base de datos.
		return &result, nil
	}

	return &result, nil
}

func nullableUUID(id string) interface{} {
	if id == "" {
		return nil
	}
	return id
}
