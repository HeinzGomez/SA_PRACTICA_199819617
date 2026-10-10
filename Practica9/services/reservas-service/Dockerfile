# HeinzGomez - Práctica 9: imagen del Servicio de Reservas (Go). Contexto de build: raíz del repositorio.
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY services/reservas-service/ ./
# Si go.sum no está versionado se resuelve aquí (recomendado: ejecutar "go mod tidy" y commitear go.sum)
RUN if [ ! -f go.sum ]; then go mod tidy; fi && go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/reservas ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/reservas /reservas
USER nonroot
ENTRYPOINT ["/reservas"]
