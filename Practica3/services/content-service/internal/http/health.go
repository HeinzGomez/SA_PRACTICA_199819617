package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// NewHealthRouter expone unicamente un endpoint /health para chequeos de
// liveness/readiness del contenedor (Docker/Cloud). No se expone ninguna
// otra ruta HTTP: el trafico funcional real viaja por gRPC.
func NewHealthRouter() *gin.Engine {
	r := gin.Default()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "content-service"})
	})
	return r
}
