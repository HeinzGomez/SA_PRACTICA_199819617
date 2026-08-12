package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"yousac/content-service/internal/models"
)

type PlaybackRepository struct {
	pool *pgxpool.Pool
}

func NewPlaybackRepository(pool *pgxpool.Pool) *PlaybackRepository {
	return &PlaybackRepository{pool: pool}
}

// RegisterEvent inserta un evento de reproduccion de alta concurrencia
// (play/pause/seek/complete). Tabla optimizada para escritura masiva;
// el trigger trg_update_view_counters mantiene contadores agregados.
func (r *PlaybackRepository) RegisterEvent(ctx context.Context, userID, recordingID, eventType string, position int32) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO playback_events (user_id, recording_id, event_type, position_seconds)
		VALUES ($1, $2, $3, $4)
	`, userID, recordingID, eventType, position)
	return err
}

// SaveCheckpoint hace upsert del ultimo punto de avance del estudiante,
// identificando con precision semestre/curso/unidad/tema y segundo exacto.
func (r *PlaybackRepository) SaveCheckpoint(ctx context.Context, userID, recordingID string, position int32, unit, topic string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO checkpoints (user_id, recording_id, position_seconds, unit, topic, updated_at)
		VALUES ($1, $2, $3, $4, $5, now())
		ON CONFLICT (user_id, recording_id)
		DO UPDATE SET position_seconds = EXCLUDED.position_seconds,
		              unit = EXCLUDED.unit,
		              topic = EXCLUDED.topic,
		              updated_at = now()
	`, userID, recordingID, position, unit, topic)
	return err
}

func (r *PlaybackRepository) GetLastCheckpoint(ctx context.Context, userID, recordingID string) (*models.Checkpoint, error) {
	var c models.Checkpoint
	err := r.pool.QueryRow(ctx, `
		SELECT position_seconds, unit, topic, updated_at
		FROM checkpoints WHERE user_id = $1 AND recording_id = $2
	`, userID, recordingID).Scan(&c.PositionSeconds, &c.Unit, &c.Topic, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// GetRecentHistory usa la vista v_recent_history (join checkpoints + catalogo).
func (r *PlaybackRepository) GetRecentHistory(ctx context.Context, userID string, limit int32) ([]models.HistoryItem, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT recording_id, title, course_id, unit, topic, position_seconds, last_watched_at
		FROM v_recent_history
		WHERE user_id = $1
		ORDER BY last_watched_at DESC
		LIMIT $2
	`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.HistoryItem
	for rows.Next() {
		var h models.HistoryItem
		if err := rows.Scan(&h.RecordingID, &h.Title, &h.CourseID, &h.Unit, &h.Topic, &h.PositionSeconds, &h.LastWatchedAt); err != nil {
			return nil, err
		}
		items = append(items, h)
	}
	return items, nil
}
