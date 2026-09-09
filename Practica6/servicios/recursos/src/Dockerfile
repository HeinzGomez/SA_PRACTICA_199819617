FROM golang:1.25-alpine AS build

ENV CGO_ENABLED=0

RUN apk add --no-cache protobuf \
    && go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.11 \
    && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.6.1

WORKDIR /app

COPY servicios/recursos/src/go.mod servicios/recursos/src/go.sum ./
RUN go mod download

COPY servicios/recursos/src ./src
COPY contratos/recursos.proto ./contratos/recursos.proto

WORKDIR /app/src

RUN protoc -I /app/contratos --go_out=. --go-grpc_out=. /app/contratos/recursos.proto \
    && go build -o /out/recursos-server .

FROM alpine:3.20 AS runtime

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/recursos-server .

EXPOSE 50057 3007

CMD ["./recursos-server"]
