// HeinzGomez - Práctica 9: pruebas del adaptador de entrada (cola RPC -> casos de uso).
package rpcapi_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/academix/reservas-service/internal/broker"
	"github.com/academix/reservas-service/internal/domain"
	"github.com/academix/reservas-service/internal/rpcapi"
	"github.com/academix/reservas-service/internal/service"
	"github.com/academix/reservas-service/internal/store"
)

type pubFalso struct {
	keys []string
	err  error
}

func (p *pubFalso) Publicar(_ context.Context, rk string, _ domain.MensajeReserva) error {
	if p.err != nil {
		return p.err
	}
	p.keys = append(p.keys, rk)
	return nil
}

// repoFallo falla al crear: provoca un error sin código de dominio (INTERNAL).
type repoFallo struct{ store.MemoryTicketRepo }

func (r *repoFallo) Crear(context.Context, domain.Ticket) error {
	return errors.New("columna id duplicada")
}

var fijo = time.Date(2026, 10, 5, 15, 0, 0, 0, time.UTC)

func nuevoServer(pub *pubFalso) *rpcapi.Server {
	secuencia := 0
	return nuevoServerRepo(service.NewReservasService(store.NewMemoryTicketRepo(), pub).
		WithClock(func() time.Time { return fijo }).
		WithIDGenerator(func() string {
			secuencia++
			return fmt.Sprintf("TKT-TEST%08d", secuencia)
		}))
}

func nuevoServerRepo(svc *service.ReservasService) *rpcapi.Server {
	return rpcapi.NewServer(svc)
}

type envoltura struct {
	OK    bool            `json:"ok"`
	Datos json.RawMessage `json:"datos"`
	Error *struct {
		Codigo  string `json:"codigo"`
		Mensaje string `json:"mensaje"`
	} `json:"error"`
}

func envolver(t *testing.T, b []byte) envoltura {
	t.Helper()
	var e envoltura
	if err := json.Unmarshal(b, &e); err != nil {
		t.Fatalf("respuesta no es JSON: %v (%s)", err, b)
	}
	return e
}

func llamar(t *testing.T, srv *rpcapi.Server, rk, cuerpo string) envoltura {
	t.Helper()
	h, ok := srv.Manejadores()[rk]
	if !ok {
		t.Fatalf("falta la operación %q", rk)
	}
	resp, err := h(context.Background(), json.RawMessage(cuerpo))
	if err != nil {
		t.Fatalf("el handler no debe devolver error de transporte: %v", err)
	}
	return envolver(t, resp)
}

func TestManejadores_ExponeLasTresOperacionesDelContrato(t *testing.T) {
	m := nuevoServer(&pubFalso{}).Manejadores()
	if len(m) != 3 {
		t.Fatalf("se esperaban 3 operaciones, hubo %d", len(m))
	}
	for _, rk := range []string{domain.RKSolicitarReserva, domain.RKConsultarTicket, domain.RKListarReservasUsuario} {
		if _, ok := m[rk]; !ok {
			t.Errorf("falta la operación %q", rk)
		}
	}
}

func TestDespachador_RutaDesconocidaFalla(t *testing.T) {
	d := nuevoServer(&pubFalso{}).Despachador()
	_, err := d(context.Background(), broker.SolicitudRPC{
		Operacion: "reservas.inexistente", Cuerpo: json.RawMessage(`{}`),
	})
	if err == nil || !strings.Contains(err.Error(), "no soportada") {
		t.Errorf("una operación desconocida debe ir a la DLQ, no a responder: %v", err)
	}
}

func TestDespachador_DespachaLaOperacionReal(t *testing.T) {
	d := nuevoServer(&pubFalso{}).Despachador()
	resp, err := d(context.Background(), broker.SolicitudRPC{
		Operacion: domain.RKConsultarTicket, Cuerpo: json.RawMessage(`{"id":"NOPE"}`),
	})
	if err != nil {
		t.Fatalf("handler: %v", err)
	}
	e := envolver(t, resp)
	if e.OK || e.Error == nil || e.Error.Codigo != "NOT_FOUND" {
		t.Errorf("se esperaba NOT_FOUND, llegó %s", resp)
	}
}

func TestSolicitarReserva_Exitosa(t *testing.T) {
	e := llamar(t, nuevoServer(&pubFalso{}), domain.RKSolicitarReserva,
		`{"usuario_id":"u1","evento_id":"evt-1","tipo":""}`)
	if !e.OK || e.Error != nil {
		t.Fatalf("se esperaba ok:true")
	}
	var tk rpcapi.TicketJSON
	if err := json.Unmarshal(e.Datos, &tk); err != nil {
		t.Fatalf("datos no es un TicketJSON: %v", err)
	}
	if !strings.HasPrefix(tk.ID, "TKT-TEST") || tk.Estado != "PENDIENTE" || tk.Tipo != domain.TipoAcreditacion {
		t.Errorf("ticket inesperado: %+v", tk)
	}
	if tk.CreadoEn != "2026-10-05T15:00:00Z" {
		t.Errorf("creado_en debe ser RFC3339 en UTC, vino %q", tk.CreadoEn)
	}
}

func TestSolicitarReserva_JSONMalformado(t *testing.T) {
	e := llamar(t, nuevoServer(&pubFalso{}), domain.RKSolicitarReserva, `{no-json`)
	if e.OK || e.Error == nil || e.Error.Codigo != "INVALID_ARGUMENT" {
		t.Errorf("se esperaba INVALID_ARGUMENT, llegó ok=%v", e.OK)
	}
}

func TestSolicitarReserva_DatosFaltantes(t *testing.T) {
	e := llamar(t, nuevoServer(&pubFalso{}), domain.RKSolicitarReserva, `{"usuario_id":"","evento_id":"e"}`)
	if e.Error == nil || e.Error.Codigo != "INVALID_ARGUMENT" || e.Error.Mensaje != domain.ErrDatosInvalidos.Error() {
		t.Errorf("mensaje inesperado: %+v", e.Error)
	}
}

func TestSolicitarReserva_BrokerCaidoEsUnavailable(t *testing.T) {
	pub := &pubFalso{err: errors.New("conexión rechazada")}
	e := llamar(t, nuevoServer(pub), domain.RKSolicitarReserva, `{"usuario_id":"u1","evento_id":"e"}`)
	if e.OK || e.Error == nil || e.Error.Codigo != "UNAVAILABLE" {
		t.Errorf("se esperaba UNAVAILABLE, llegó %+v", e.Error)
	}
}

func TestErrorSinCodigoDeDominioEsInternalSinDetalle(t *testing.T) {
	repo := &repoFallo{}
	svc := service.NewReservasService(repo, &pubFalso{})
	e := llamar(t, nuevoServerRepo(svc), domain.RKSolicitarReserva, `{"usuario_id":"u1","evento_id":"e"}`)
	if e.OK || e.Error == nil || e.Error.Codigo != "INTERNAL" {
		t.Fatalf("se esperaba INTERNAL, llegó %+v", e.Error)
	}
	if e.Error.Mensaje != "Error interno" {
		t.Errorf("INTERNAL no debe filtrar el detalle, llegó %q", e.Error.Mensaje)
	}
	if strings.Contains(e.Error.Mensaje, "duplicada") {
		t.Error("el mensaje interno del repositorio no debe llegar al gateway")
	}
}

func TestConsultarTicket_ExitosoYNoEncontrado(t *testing.T) {
	srv := nuevoServer(&pubFalso{})
	creado := llamar(t, srv, domain.RKSolicitarReserva, `{"usuario_id":"u1","evento_id":"evt-1"}`)
	var tk rpcapi.TicketJSON
	_ = json.Unmarshal(creado.Datos, &tk)

	e := llamar(t, srv, domain.RKConsultarTicket, `{"id":"`+tk.ID+`"}`)
	if !e.OK {
		t.Fatalf("se esperaba ok:true")
	}
	var visto rpcapi.TicketJSON
	_ = json.Unmarshal(e.Datos, &visto)
	if visto.ID != tk.ID || visto.EventoID != "evt-1" {
		t.Errorf("ticket distinto: %+v", visto)
	}

	e = llamar(t, srv, domain.RKConsultarTicket, `{"id":"NOPE"}`)
	if e.OK || e.Error == nil || e.Error.Codigo != "NOT_FOUND" {
		t.Errorf("se esperaba NOT_FOUND, llegó %+v", e.Error)
	}

	e = llamar(t, srv, domain.RKConsultarTicket, `{malo`)
	if e.Error == nil || e.Error.Codigo != "INVALID_ARGUMENT" {
		t.Errorf("se esperaba INVALID_ARGUMENT, llegó %+v", e.Error)
	}
}

func TestListarReservasUsuario(t *testing.T) {
	srv := nuevoServer(&pubFalso{})
	for _, ev := range []string{"evt-1", "evt-2"} {
		if e := llamar(t, srv, domain.RKSolicitarReserva, `{"usuario_id":"u9","evento_id":"`+ev+`"}`); !e.OK {
			t.Fatalf("falló al crear %s", ev)
		}
	}

	e := llamar(t, srv, domain.RKListarReservasUsuario, `{"id":"u9"}`)
	var lista rpcapi.ListarTicketsJSON
	if !e.OK || json.Unmarshal(e.Datos, &lista) != nil || len(lista.Tickets) != 2 {
		t.Fatalf("se esperaban 2 tickets: %+v", e)
	}
	if lista.Tickets[0].ID == "" {
		t.Error("la lista no puede traer tickets vacíos")
	}

	e = llamar(t, srv, domain.RKListarReservasUsuario, `{`)
	if e.Error == nil || e.Error.Codigo != "INVALID_ARGUMENT" {
		t.Errorf("se esperaba INVALID_ARGUMENT, llegó %+v", e.Error)
	}

	e = llamar(t, srv, domain.RKListarReservasUsuario, `{"id":"  "}`)
	if e.Error == nil || e.Error.Codigo != "INVALID_ARGUMENT" {
		t.Errorf("usuario en blanco debe ser INVALID_ARGUMENT, llegó %+v", e.Error)
	}
}
