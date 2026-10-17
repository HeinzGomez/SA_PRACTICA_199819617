// HeinzGomez - Práctica 9: pruebas del repositorio en memoria de tickets y de cupos.
package store_test

import (
	"context"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/store"
)

func TestMemoryTicketRepo_Consultas(t *testing.T) {
	r := store.NewMemoryTicketRepo()
	ctx := context.Background()

	if _, err := r.Obtener(ctx, "no-existe"); err != domain.ErrTicketNoExiste {
		t.Errorf("Obtener de un id inexistente debe ser ErrTicketNoExiste, fue %v", err)
	}

	base := domain.Ticket{ID: "a", UsuarioID: "u1", Estado: domain.EstadoPendiente}
	if err := r.Crear(ctx, base); err != nil {
		t.Fatalf("Crear: %v", err)
	}

	visto, err := r.Obtener(ctx, "a")
	if err != nil || visto.ID != "a" {
		t.Fatalf("Obtener: %+v %v", visto, err)
	}
	visto.Estado = domain.EstadoConfirmada // la copia no debe mutar el repositorio
	if guardado, _ := r.Obtener(ctx, "a"); guardado.Estado != domain.EstadoPendiente {
		t.Error("Obtener debe devolver una copia, no la referencia interna")
	}

	if err := r.Actualizar(ctx, domain.Ticket{ID: "a", Estado: domain.EstadoConfirmada}); err != nil {
		t.Fatalf("Actualizar: %v", err)
	}
	if guardado, _ := r.Obtener(ctx, "a"); guardado.Estado != domain.EstadoConfirmada {
		t.Errorf("Actualizar no persistió el cambio: %+v", guardado)
	}
}

func TestMemoryTicketRepo_ListadoOrdenadoDescendente(t *testing.T) {
	r := store.NewMemoryTicketRepo()
	ctx := context.Background()
	anciano := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	recente := time.Date(2026, 10, 5, 0, 0, 0, 0, time.UTC)
	_ = r.Crear(ctx, domain.Ticket{ID: "viejo", UsuarioID: "u9", CreadoEn: anciano})
	_ = r.Crear(ctx, domain.Ticket{ID: "nuevo", UsuarioID: "u9", CreadoEn: recente})
	_ = r.Crear(ctx, domain.Ticket{ID: "otro", UsuarioID: "otro", CreadoEn: recente})

	l, err := r.ListarPorUsuario(ctx, "u9")
	if err != nil || len(l) != 2 {
		t.Fatalf("se esperaban 2 tickets de u9: %d (%v)", len(l), err)
	}
	if l[0].ID != "nuevo" || l[1].ID != "viejo" {
		t.Errorf("el listado debe ir del más reciente al más antiguo: %v", []string{l[0].ID, l[1].ID})
	}

	vacio, _ := r.ListarPorUsuario(ctx, "nadie")
	if vacio == nil || len(vacio) != 0 {
		t.Errorf("un usuario sin reservas debe devolver una lista vacía (no nil): %v", vacio)
	}
}

func TestMemoryCupoStore_Disponible(t *testing.T) {
	ctx := context.Background()
	m := store.NewMemoryCupoStore()
	if m.Disponible("nunca-inicializado") != 0 {
		t.Error("un evento desconocido debe reportar 0 disponibles")
	}
	m.Inicializar("e", 5)
	if m.Disponible("e") != 5 {
		t.Errorf("Disponible = %d, se esperaba 5", m.Disponible("e"))
	}
	m.Inicializar("e", 99) // reproinicializar cambia el cupo (así lo hace el script Lua)
	if m.Disponible("e") != 99 {
		t.Errorf("Inicializar debe fijar el cupo, quedó %d", m.Disponible("e"))
	}
	// el primer Inicializar ya abrió el set de inscritos
	_, _ = m.Reservar(ctx, "e", "u1")
	if m.Disponible("e") != 98 {
		t.Errorf("tras reservar, disponibles = %d (se esperaba 98)", m.Disponible("e"))
	}
}
