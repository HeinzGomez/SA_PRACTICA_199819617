// HeinzGomez - Práctica 7: prueba del script Lua contra un Redis real.
// Se ejecuta solo si existe REDIS_ADDR (en CI se levanta un service container de Redis).
package store_test

import (
	"context"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/store"
	"github.com/redis/go-redis/v9"
)

func TestRedisCupoStore_ScriptAtomico(t *testing.T) {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		t.Skip("REDIS_ADDR no definido; se omite la prueba contra Redis real")
	}
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: addr})
	defer rdb.Close()
	evt := "test-lua"
	rdb.Del(ctx, store.CupoKey(evt), store.InscritosKey(evt))
	rdb.Set(ctx, store.CupoKey(evt), 10, 0)
	defer rdb.Del(ctx, store.CupoKey(evt), store.InscritosKey(evt))

	s := store.NewRedisCupoStore(rdb)
	var wg sync.WaitGroup
	var mu sync.Mutex
	ok := 0
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			r, err := s.Reservar(ctx, evt, fmt.Sprintf("u%d", i))
			if err != nil {
				t.Error(err)
				return
			}
			if r >= 0 {
				mu.Lock()
				ok++
				mu.Unlock()
			}
		}(i)
	}
	wg.Wait()
	if ok != 10 {
		t.Errorf("confirmadas=%d, se esperaban 10", ok)
	}
	if r, _ := s.Reservar(ctx, evt, "u1"); r != domain.CupoDuplicado && r != domain.CupoSinDisponibilidad {
		t.Errorf("resultado inesperado para usuario repetido: %d", r)
	}
	if r, _ := s.Reservar(ctx, "no-existe", "u1"); r != domain.CupoEventoInexistente {
		t.Errorf("evento inexistente debe devolver -3, devolvió %d", r)
	}
}

func TestMemoryCupoStore(t *testing.T) {
	m := store.NewMemoryCupoStore()
	m.Inicializar("e", 1)
	ctx := context.Background()
	if r, _ := m.Reservar(ctx, "e", "a"); r != 0 {
		t.Errorf("primer reserva debe dejar 0, dejó %d", r)
	}
	if r, _ := m.Reservar(ctx, "e", "a"); r != domain.CupoDuplicado {
		t.Errorf("duplicado esperado")
	}
	if r, _ := m.Reservar(ctx, "e", "b"); r != domain.CupoSinDisponibilidad {
		t.Errorf("sin cupo esperado")
	}
	if r, _ := m.Reservar(ctx, "x", "b"); r != domain.CupoEventoInexistente {
		t.Errorf("inexistente esperado")
	}
}

func TestMemoryTicketRepo(t *testing.T) {
	r := store.NewMemoryTicketRepo()
	ctx := context.Background()
	if err := r.Actualizar(ctx, domain.Ticket{ID: "x"}); err != domain.ErrTicketNoExiste {
		t.Errorf("actualizar inexistente debe fallar")
	}
	_ = r.Crear(ctx, domain.Ticket{ID: "a", UsuarioID: "u"})
	_ = r.Crear(ctx, domain.Ticket{ID: "b", UsuarioID: "v"})
	l, _ := r.ListarPorUsuario(ctx, "u")
	if len(l) != 1 || l[0].ID != "a" {
		t.Errorf("listar por usuario incorrecto: %+v", l)
	}
}

func TestClavesDeCupo(t *testing.T) {
	if store.CupoKey("evt-1") != "cupo:evento:evt-1" {
		t.Errorf("clave de cupo fuera de contrato con Talleres: %s", store.CupoKey("evt-1"))
	}
	if store.InscritosKey("evt-1") != "inscritos:evento:evt-1" {
		t.Errorf("clave de inscritos fuera de contrato: %s", store.InscritosKey("evt-1"))
	}
}

// Sin Redis vivo: la construcción no conecta y Reservar devuelve el error de red.
func TestRedisCupoStore_SinServidor(t *testing.T) {
	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:1", DialTimeout: 500 * time.Millisecond})
	defer rdb.Close()

	s := store.NewRedisCupoStore(rdb)
	if s == nil {
		t.Fatal("NewRedisCupoStore no puede devolver nil")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if _, err := s.Reservar(ctx, "evt-1", "u1"); err == nil {
		t.Error("sin Redis escuchando, Reservar debe devolver error (no un resultado inventado)")
	}
}
