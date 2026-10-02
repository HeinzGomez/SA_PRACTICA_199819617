// HeinzGomez - Práctica 7: repositorio de tickets en PostgreSQL (reservas_db)
package store

import (
	"context"
	"errors"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const Migracion = `
CREATE TABLE IF NOT EXISTS reserva_ticket (
  id              VARCHAR(20) PRIMARY KEY,
  usuario_id      VARCHAR(64) NOT NULL,
  evento_id       VARCHAR(64) NOT NULL,
  tipo            VARCHAR(30) NOT NULL DEFAULT 'ACREDITACION',
  estado          VARCHAR(15) NOT NULL CHECK (estado IN ('PENDIENTE','CONFIRMADA','RECHAZADA')),
  motivo          VARCHAR(40),
  cupo_restante   INTEGER,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_usuario ON reserva_ticket(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evento_estado ON reserva_ticket(evento_id, estado);
CREATE UNIQUE INDEX IF NOT EXISTS ux_ticket_confirmado
  ON reserva_ticket(usuario_id, evento_id) WHERE estado = 'CONFIRMADA';
`

type PostgresTicketRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresTicketRepo(ctx context.Context, dsn string) (*PostgresTicketRepo, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if _, err := pool.Exec(ctx, Migracion); err != nil {
		return nil, err
	}
	return &PostgresTicketRepo{pool: pool}, nil
}

func (r *PostgresTicketRepo) Close() { r.pool.Close() }

func (r *PostgresTicketRepo) Crear(ctx context.Context, t domain.Ticket) error {
	_, err := r.pool.Exec(ctx, `INSERT INTO reserva_ticket
		(id, usuario_id, evento_id, tipo, estado, motivo, cupo_restante, creado_en, actualizado_en)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		t.ID, t.UsuarioID, t.EventoID, t.Tipo, string(t.Estado), t.Motivo, t.CupoRestante, t.CreadoEn, t.ActualizadoEn)
	return err
}

func (r *PostgresTicketRepo) Actualizar(ctx context.Context, t domain.Ticket) error {
	tag, err := r.pool.Exec(ctx, `UPDATE reserva_ticket
		SET estado=$2, motivo=$3, cupo_restante=$4, actualizado_en=$5 WHERE id=$1`,
		t.ID, string(t.Estado), t.Motivo, t.CupoRestante, t.ActualizadoEn)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrTicketNoExiste
	}
	return nil
}

const columnas = `id, usuario_id, evento_id, tipo, estado, COALESCE(motivo,''), COALESCE(cupo_restante,-1), creado_en, actualizado_en`

func scanTicket(row pgx.Row) (domain.Ticket, error) {
	var t domain.Ticket
	var estado string
	var creado, actualizado time.Time
	if err := row.Scan(&t.ID, &t.UsuarioID, &t.EventoID, &t.Tipo, &estado, &t.Motivo, &t.CupoRestante, &creado, &actualizado); err != nil {
		return domain.Ticket{}, err
	}
	t.Estado = domain.Estado(estado)
	t.CreadoEn, t.ActualizadoEn = creado, actualizado
	return t, nil
}

func (r *PostgresTicketRepo) Obtener(ctx context.Context, id string) (domain.Ticket, error) {
	t, err := scanTicket(r.pool.QueryRow(ctx, `SELECT `+columnas+` FROM reserva_ticket WHERE id=$1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Ticket{}, domain.ErrTicketNoExiste
	}
	return t, err
}

func (r *PostgresTicketRepo) ListarPorUsuario(ctx context.Context, usuarioID string) ([]domain.Ticket, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+columnas+` FROM reserva_ticket WHERE usuario_id=$1 ORDER BY creado_en DESC`, usuarioID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []domain.Ticket{}
	for rows.Next() {
		t, err := scanTicket(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
