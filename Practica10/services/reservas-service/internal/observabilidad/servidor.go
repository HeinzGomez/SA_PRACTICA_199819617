// HeinzGomez - Práctica 10: servidor HTTP mínimo de observabilidad (liveness, readiness y /metrics).
// El servicio no expone API propia: solo estas tres rutas, con el módulo nativo net/http.
package observabilidad

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Sondas son los sondeos de readiness que el composition root inyecta:
// cada uno devuelve nil si la dependencia responde o un error si no.
type Sondas struct {
	Postgres func(ctx context.Context) error
	Redis    func(ctx context.Context) error
	Broker   func() error
}

// ServidorAtencion atiende /health, /health/ready y /metrics en el puerto asignado.
type ServidorAtencion struct {
	puerto   int
	metricas *Metricas
	sondas   Sondas
	version  string
	servidor *http.Server
	listener net.Listener
}

func NuevoServidorAtencion(puerto int, metricas *Metricas, sondas Sondas, version string) *ServidorAtencion {
	return &ServidorAtencion{puerto: puerto, metricas: metricas, sondas: sondas, version: version}
}

// Iniciar escucha en el puerto (0 = efímero, útil en pruebas) y devuelve el puerto real.
func (s *ServidorAtencion) Iniciar() (int, error) {
	if s.listener != nil {
		return s.listener.Addr().(*net.TCPAddr).Port, nil
	}
	listener, err := net.Listen("tcp", fmt.Sprintf(":%d", s.puerto))
	if err != nil {
		return 0, err
	}
	s.listener = listener
	// Se captura en una variable local: el goroutine no debe leer s.servidor
	// (Detener lo pone en nil y dejaría el Serve sin servidor).
	servidor := &http.Server{Handler: s.rutas(), ReadHeaderTimeout: 5 * time.Second}
	s.servidor = servidor
	go func() {
		_ = servidor.Serve(listener)
	}()
	return listener.Addr().(*net.TCPAddr).Port, nil
}

// Detener cierra el servidor; idempotente.
func (s *ServidorAtencion) Detener(ctx context.Context) error {
	if s.servidor == nil {
		return nil
	}
	err := s.servidor.Shutdown(ctx)
	// Shutdown solo cierra los listeners ya registrados por Serve; si el goroutine
	// de Serve aún no arrancó, el listener se fuga y el puerto seguiría abierto.
	if s.listener != nil {
		_ = s.listener.Close()
	}
	s.servidor, s.listener = nil, nil
	return err
}

func (s *ServidorAtencion) rutas() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.liveness)
	mux.HandleFunc("/health/ready", s.readiness)
	mux.HandleFunc("/metrics", s.exponer)
	return mux
}

func (s *ServidorAtencion) sello() map[string]any {
	return map[string]any{
		"servicio":  "reservas-service",
		"version":   s.version,
		"uptime_s":  int(time.Since(inicioProceso).Seconds()),
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}
}

// liveness: el proceso responde. Es el healthcheck de Docker/K8s y no depende de nadie.
func (s *ServidorAtencion) liveness(w http.ResponseWriter, _ *http.Request) {
	responderJSON(w, http.StatusOK, map[string]any{"status": "ok", "sello": s.sello()})
}

// readiness: además de vivo, postgres, redis y el broker deben responder.
func (s *ServidorAtencion) readiness(w http.ResponseWriter, req *http.Request) {
	ctx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
	defer cancel()

	estados := map[string]string{}
	listo := true

	for nombre, sondeo := range map[string]func(context.Context) error{
		"postgres": s.sondas.Postgres,
		"redis":    s.sondas.Redis,
	} {
		if sondeo == nil {
			estados[nombre] = "no-verificado"
			continue
		}
		if err := sondeo(ctx); err != nil {
			estados[nombre] = "down"
			listo = false
		} else {
			estados[nombre] = "ok"
		}
	}

	if s.sondas.Broker != nil {
		if err := s.sondas.Broker(); err != nil {
			estados["broker"] = "down"
			listo = false
		} else {
			estados["broker"] = "ok"
		}
	} else {
		estados["broker"] = "no-verificado"
	}

	estado := "not_ready"
	if listo {
		estado = "ready"
	}
	respuesta := map[string]any{"status": estado, "sello": s.sello()}
	for k, v := range estados {
		respuesta[k] = v
	}
	codigo := http.StatusServiceUnavailable
	if listo {
		codigo = http.StatusOK
	}
	responderJSON(w, codigo, respuesta)
}

// exponer sirve el registro Prometheus (scraping del job del servicio).
func (s *ServidorAtencion) exponer(w http.ResponseWriter, req *http.Request) {
	promhttp.HandlerFor(s.metricas.Registro, promhttp.HandlerOpts{}).ServeHTTP(w, req)
}

func responderJSON(w http.ResponseWriter, codigo int, cuerpo any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(codigo)
	_ = json.NewEncoder(w).Encode(cuerpo)
}

var inicioProceso = time.Now()
