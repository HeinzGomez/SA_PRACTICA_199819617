FROM golang:1.25-alpine AS build

ENV CGO_ENABLED=0

RUN apk add --no-cache protobuf \
    && go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.11 \
    && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.6.1

WORKDIR /app

COPY servicios/grabaciones/src/go.mod servicios/grabaciones/src/go.sum ./
RUN go mod download

COPY servicios/grabaciones/src ./src
COPY contratos/grabaciones.proto ./contratos/grabaciones.proto

WORKDIR /app/src

RUN protoc -I /app/contratos --go_out=. --go-grpc_out=. /app/contratos/grabaciones.proto \
    && go build -o /out/grabaciones-server .

FROM alpine:3.20 AS runtime

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/grabaciones-server .

EXPOSE 50053 3003

CMD ["./grabaciones-server"]
