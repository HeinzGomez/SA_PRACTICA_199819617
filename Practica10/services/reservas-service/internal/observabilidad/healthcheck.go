// HeinzGomez - Práctica 10: healthcheck del contenedor.
// distroless no trae shell ni curl, así que el propio binario expone el subcomando:
//
//	/reservas healthcheck  ->  exit 0 si /health responde, 1 si no
package observabilidad

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// SondearSalud consulta /health en el puerto dado y devuelve nil si el proceso responde.
func SondearSalud(puerto int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("http://127.0.0.1:%d/health", puerto), nil)
	if err != nil {
		return err
	}
	respuesta, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer respuesta.Body.Close()
	if respuesta.StatusCode != http.StatusOK {
		return fmt.Errorf("liveness devolvió %d", respuesta.StatusCode)
	}
	return nil
}
