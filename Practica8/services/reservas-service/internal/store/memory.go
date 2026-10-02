// HeinzGomez - Práctica 7: implementaciones en memoria (pruebas unitarias y modo sin infraestructura)
package store

import (
	"context"
	"sort"
	"sync"

	"github.com/academix/reservas-service/internal/domain"
)

type MemoryTicketRepo struct {
	mu      sync.RWMutex
	tickets map[string]domain.Ticket
}

func NewMemoryTicketRepo() *MemoryTicketRepo {
	return &MemoryTicketRepo{tickets: map[string]domain.Ticket{}}
}

func (r *MemoryTicketRepo) Crear(_ context.Context, t domain.Ticket) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.tickets[t.ID] = t
	return nil
}

func (r *MemoryTicketRepo) Actualizar(_ context.Context, t domain.Ticket) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.tickets[t.ID]; !ok {
		return domain.ErrTicketNoExiste
	}
	r.tickets[t.ID] = t
	return nil
}

func (r *MemoryTicketRepo) Obtener(_ context.Context, id string) (domain.Ticket, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.tickets[id]
	if !ok {
		return domain.Ticket{}, domain.ErrTicketNoExiste
	}
	return t, nil
}

func (r *MemoryTicketRepo) ListarPorUsuario(_ context.Context, usuarioID string) ([]domain.Ticket, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := []domain.Ticket{}
	for _, t := range r.tickets {
		if t.UsuarioID == usuarioID {
			out = append(out, t)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreadoEn.After(out[j].CreadoEn) })
	return out, nil
}

// MemoryCupoStore replica la semántica del script Lua de Redis con un mutex.
type MemoryCupoStore struct {
	mu       sync.Mutex
	cupos    map[string]int64
	inscritos map[string]map[string]bool
}

func NewMemoryCupoStore() *MemoryCupoStore {
	return &MemoryCupoStore{cupos: map[string]int64{}, inscritos: map[string]map[string]bool{}}
}

func (m *MemoryCupoStore) Inicializar(eventoID string, cupo int64) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.cupos[eventoID] = cupo
	if m.inscritos[eventoID] == nil {
		m.inscritos[eventoID] = map[string]bool{}
	}
}

func (m *MemoryCupoStore) Disponible(eventoID string) int64 {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.cupos[eventoID]
}

func (m *MemoryCupoStore) Reservar(_ context.Context, eventoID, usuarioID string) (domain.ResultadoCupo, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	cupo, ok := m.cupos[eventoID]
	if !ok {
		return domain.CupoEventoInexistente, nil
	}
	if m.inscritos[eventoID][usuarioID] {
		return domain.CupoDuplicado, nil
	}
	if cupo <= 0 {
		return domain.CupoSinDisponibilidad, nil
	}
	m.cupos[eventoID] = cupo - 1
	m.inscritos[eventoID][usuarioID] = true
	return domain.ResultadoCupo(cupo - 1), nil
}
