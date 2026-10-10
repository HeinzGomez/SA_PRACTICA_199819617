// HeinzGomez - Práctica 9: pruebas unitarias del modelo de dominio de Reservas.
package domain_test

import (
	"encoding/json"
	"errors"
	"testing"

	"github.com/academix/reservas-service/internal/domain"
)

func TestRoutingKeysRPC(t *testing.T) {
	rk := domain.RoutingKeysRPC()
	want := []string{domain.RKSolicitarReserva, domain.RKConsultarTicket, domain.RKListarReservasUsuario}
	if len(rk) != len(want) {
		t.Fatalf("se esperaban %d routing keys, hubo %d", len(want), len(rk))
	}
	seen := map[string]bool{}
	for _, k := range rk {
		seen[k] = true
	}
	for _, k := range want {
		if !seen[k] {
			t.Errorf("falta la routing key %q", k)
		}
	}
	// Deben coincidir con las que declara la cola RPC del broker.
	if rk[0] != "reservas.solicitar" || rk[1] != "reservas.consultar_ticket" || rk[2] != "reservas.listar_usuario" {
		t.Errorf("routing keys fuera de contrato: %v", rk)
	}
}

func TestConstantesDeEventoYMotivos(t *testing.T) {
	if domain.RKReservaSolicitada != "reserva.solicitada" ||
		domain.RKReservaConfirmada != "reserva.confirmada" ||
		domain.RKReservaRechazada != "reserva.rechazada" {
		t.Error("las routing keys de eventos cambiaron de nombre")
	}
	if domain.EstadoPendiente != "PENDIENTE" || domain.EstadoConfirmada != "CONFIRMADA" || domain.EstadoRechazada != "RECHAZADA" {
		t.Error("los estados deben seguir el contrato del JSON compartido")
	}
	if domain.MotivoSinCupo != "SIN_CUPO" || domain.MotivoDuplicada != "RESERVA_DUPLICADA" ||
		domain.MotivoEventoNoExiste != "EVENTO_NO_EXISTE" || domain.MotivoErrorInterno != "ERROR_INTERNO" {
		t.Error("los motivos de rechazo cambiaron")
	}
	if domain.TipoAcreditacion != "ACREDITACION" || domain.TipoExamenCertificacion != "EXAMEN_CERTIFICACION" {
		t.Error("los tipos de reserva cambiaron")
	}
}

func TestErroresDeDominioSonIdentificables(t *testing.T) {
	if !errors.Is(domain.ErrDatosInvalidos, domain.ErrDatosInvalidos) {
		t.Error("ErrDatosInvalidos debe ser comparable con errors.Is")
	}
	if errors.Is(domain.ErrTicketNoExiste, domain.ErrDatosInvalidos) {
		t.Error("los errores de dominio deben ser distinguibles")
	}
	if domain.ErrBrokerNoDisponible == nil || domain.ErrTicketNoExiste == nil || domain.ErrDatosInvalidos == nil {
		t.Error("ningún error de dominio puede ser nil")
	}
}

func TestMotivoDesdeResultado(t *testing.T) {
	casos := map[domain.ResultadoCupo]string{
		domain.CupoSinDisponibilidad: domain.MotivoSinCupo,
		domain.CupoDuplicado:         domain.MotivoDuplicada,
		domain.CupoEventoInexistente: domain.MotivoEventoNoExiste,
		domain.ResultadoCupo(0):      "",
		domain.ResultadoCupo(17):     "",
	}
	for in, want := range casos {
		if got := domain.MotivoDesdeResultado(in); got != want {
			t.Errorf("MotivoDesdeResultado(%d)=%q, se esperaba %q", in, got, want)
		}
	}
}

func TestNormalizarTipo(t *testing.T) {
	if got := domain.NormalizarTipo(domain.TipoExamenCertificacion); got != domain.TipoExamenCertificacion {
		t.Errorf("el examen de certificación debe conservarse, vino %q", got)
	}
	for _, entrada := range []string{"", "taller", "TALLER", "CERTIFICACION", "cualquiera"} {
		if got := domain.NormalizarTipo(entrada); got != domain.TipoAcreditacion {
			t.Errorf("NormalizarTipo(%q)=%q, se esperaba ACREDITACION", entrada, got)
		}
	}
}

func TestMensajeReservaUsaElContratoJSONDeGo(t *testing.T) {
	m := domain.MensajeReserva{
		TicketID: "TKT-1", UsuarioID: "u1", EventoID: "evt-1", Tipo: domain.TipoAcreditacion,
		Estado: domain.EstadoConfirmada, CupoRestante: 7, Timestamp: "2026-10-05T15:00:00Z",
	}
	b, err := json.Marshal(m)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var crudo map[string]any
	if err := json.Unmarshal(b, &crudo); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	// camelCase, igual que lo espera el Servicio de Talleres.
	for _, clave := range []string{"ticketId", "usuarioId", "eventoId", "tipo", "estado", "cupoRestante", "timestamp"} {
		if _, ok := crudo[clave]; !ok {
			t.Errorf("falta la clave %q en el payload: %s", clave, b)
		}
	}
	if _, ok := crudo["motivo"]; ok {
		t.Error("motivo debe omitirse cuando está vacío")
	}

	m.Motivo = domain.MotivoSinCupo
	b, _ = json.Marshal(m)
	if !json.Valid(b) {
		t.Error("el payload con motivo debe seguir siendo JSON válido")
	}

	// Round-trip: lo que publica Reservas lo puede leer Talleres/Certificados.
	var vuelta domain.MensajeReserva
	if err := json.Unmarshal(b, &vuelta); err != nil || vuelta.Motivo != domain.MotivoSinCupo || vuelta.CupoRestante != 7 {
		t.Errorf("round-trip incorrecto: %+v (%v)", vuelta, err)
	}
}
