FROM golang:1.25-alpine AS build

ENV CGO_ENABLED=0

RUN apk add --no-cache protobuf \
    && go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.11 \
    && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.6.1

WORKDIR /app

COPY servicios/historial/src/go.mod servicios/historial/src/go.sum ./
RUN go mod download

COPY servicios/historial/src ./src
COPY contratos/historial.proto ./contratos/historial.proto

WORKDIR /app/src

RUN protoc -I /app/contratos --go_out=. --go-grpc_out=. /app/contratos/historial.proto \
    && go build -o /out/historial-server .

FROM alpine:3.20 AS runtime

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/historial-server .

EXPOSE 50055 3005

CMD ["./historial-server"]
