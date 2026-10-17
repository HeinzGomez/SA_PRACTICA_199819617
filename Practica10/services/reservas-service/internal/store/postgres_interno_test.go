// HeinzGomez - Práctica 9: pruebas del repositorio PostgreSQL.
//
// package store (interno): cubren scanTicket y las rutas de error sin necesitar un
// servidor de PostgreSQL real. El DSN apunta a un puerto cerrado para que todo lo que
// intente hablar con la base falle rápido y de forma determinista.
package store

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const dsnMuerto = "postgres://academix:academix@127.0.0.1:1/reservas_db?sslmode=disable&pool_max_conns=1"

// filaFalsa alimenta scanTicket sin pasar por la red.
type filaFalsa struct {
	vals []any
	err  error
}

func (f filaFalsa) Scan(dest ...any) error {
	if f.err != nil {
		return f.err
	}
	for i, d := range dest {
		switch p := d.(type) {
		case *string:
			*p = f.vals[i].(string)
		case *int32:
			*p = f.vals[i].(int32)
		case *time.Time:
			*p = f.vals[i].(time.Time)
		}
	}
	return nil
}

func filaCompleta() filaFalsa {
	return filaFalsa{vals: []any{
		"TKT-1", "u1", "evt-1", domain.TipoAcreditacion, string(domain.EstadoConfirmada),
		"cupo=3", int32(3),
		time.Date(2026, 10, 5, 15, 0, 0, 0, time.UTC),
		time.Date(2026, 10, 5, 16, 0, 0, 0, time.UTC),
	}}
}

func TestScanTicket_MapeaTodasLasColumnas(t *testing.T) {
	tk, err := scanTicket(filaCompleta())
	if err != nil {
		t.Fatalf("scanTicket: %v", err)
	}
	if tk.ID != "TKT-1" || tk.UsuarioID != "u1" || tk.EventoID != "evt-1" {
		t.Errorf("identidad mal mapeada: %+v", tk)
	}
	if tk.Tipo != domain.TipoAcreditacion || tk.Estado != domain.EstadoConfirmada {
		t.Errorf("tipo/estado mal mapeados: tipo=%q estado=%q", tk.Tipo, tk.Estado)
	}
	if tk.Motivo != "cupo=3" || tk.CupoRestante != 3 {
		t.Errorf("motivo/cupo mal mapeados: %q / %d", tk.Motivo, tk.CupoRestante)
	}
	if !tk.CreadoEn.Equal(time.Date(2026, 10, 5, 15, 0, 0, 0, time.UTC)) ||
		!tk.ActualizadoEn.Equal(time.Date(2026, 10, 5, 16, 0, 0, 0, time.UTC)) {
		t.Errorf("fechas mal mapeadas: %v / %v", tk.CreadoEn, tk.ActualizadoEn)
	}
}

func TestScanTicket_PropagaElErrorDelRow(t *testing.T) {
	if _, err := scanTicket(filaFalsa{err: pgx.ErrNoRows}); !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("scanTicket debe devolver tal cual el error del row: %v", err)
	}
}

func TestNewPostgresTicketRepo_DSNInvalido(t *testing.T) {
	if _, err := NewPostgresTicketRepo(context.Background(), "://no-es-una-url"); err == nil {
		t.Error("un DSN inválido debe rechazarse")
	}
}

func TestNewPostgresTicketRepo_SinServidor(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	repo, err := NewPostgresTicketRepo(ctx, dsnMuerto)
	if err == nil {
		t.Fatal("sin PostgreSQL escuchando, la migración debe fallar")
	}
	if repo != nil {
		t.Error("con error, el constructor no puede devolver un repo")
	}
}

func repoSinConexion(t *testing.T) (*PostgresTicketRepo, func()) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsnMuerto)
	if err != nil {
		t.Fatalf("pgxpool.New no conecta de inmediato: %v", err)
	}
	return &PostgresTicketRepo{pool: pool}, func() { pool.Close() }
}

func TestPostgresTicketRepo_ErrorsDeRed(t *testing.T) {
	repo, cerrar := repoSinConexion(t)
	defer cerrar()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := repo.Crear(ctx, domain.Ticket{ID: "x", UsuarioID: "u"}); err == nil {
		t.Error("Crear sin base debe devolver error")
	}
	if err := repo.Actualizar(ctx, domain.Ticket{ID: "x"}); err == nil {
		t.Error("Actualizar sin base debe devolver error")
	}
	if _, err := repo.Obtener(ctx, "x"); err == nil {
		t.Error("Obtener sin base debe devolver error")
	}
	if _, err := repo.ListarPorUsuario(ctx, "u"); err == nil {
		t.Error("ListarPorUsuario sin base debe devolver error")
	}
	// sin conexión no hay filas que afectar: no puede ser ErrTicketNoExiste
	if _, err := repo.Obtener(ctx, "x"); errors.Is(err, domain.ErrTicketNoExiste) {
		t.Error("un fallo de red no debe reportarse como ticket inexistente")
	}
}
