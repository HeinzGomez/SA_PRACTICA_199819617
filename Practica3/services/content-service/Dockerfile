# Contexto de build: RAIZ del repo (ver docker-compose.*.yml)
FROM golang:1.25-alpine AS build
WORKDIR /app

RUN apk add --no-cache protobuf protobuf-dev git

COPY services/content-service/go.mod ./
RUN go mod download || true

COPY services/content-service/ ./
COPY proto /proto

# Genera los stubs de gRPC a partir de los contratos compartidos.
# NOTA: se fijan versiones EXACTAS de las herramientas (no "@latest") a
# proposito. "@latest" avanza solo y cada release nueva puede exigir una
# version de Go mas reciente que la de esta imagen (ya paso dos veces:
# de exigir Go>=1.23 a exigir Go>=1.25) — fijar version evita que el
# build se rompa espontaneamente sin que el codigo haya cambiado.
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2 && \
    go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.4.0
ENV PATH="$PATH:/root/go/bin"
# NOTA: proto_path apunta directo a /proto/content (no a /proto) para que
# los .pb.go generados caigan planos en internal/pb/ y coincidan con el
# import "yousac/content-service/internal/pb" usado en el codigo Go.
RUN mkdir -p internal/pb && \
    protoc --proto_path=/proto/content \
      --go_out=internal/pb --go_opt=paths=source_relative \
      --go-grpc_out=internal/pb --go-grpc_opt=paths=source_relative \
      /proto/content/content.proto

RUN go mod tidy
RUN go build -o /content-service ./cmd/server

FROM alpine:3.19 AS runtime
WORKDIR /app
COPY --from=build /content-service ./content-service
EXPOSE 50052 8082
CMD ["./content-service"]
