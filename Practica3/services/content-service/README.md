# content-service (Go)

Dominio: catálogo/búsqueda/detalle de clases grabadas, ingesta de reproducción
de alta concurrencia, checkpoints y historial reciente. Único canal expuesto:
**gRPC** (puerto `GRPC_PORT`, por defecto `50052`). El puerto HTTP
(`HTTP_PORT`) solo sirve `/health`.

## Generar los stubs de gRPC

Los archivos generados (`internal/pb/*.pb.go`) **no se versionan** (ver
`.gitignore` raíz). El `Dockerfile` los genera automáticamente en build. Para
desarrollo local:

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.34.2
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.4.0

mkdir -p internal/pb
protoc --proto_path=../../proto/content \
  --go_out=internal/pb --go_opt=paths=source_relative \
  --go-grpc_out=internal/pb --go-grpc_opt=paths=source_relative \
  ../../proto/content/content.proto

go mod tidy
go run ./cmd/server
```

## Base de datos

`db/init.sql` crea el esquema `content_db` (patrón *Database per
Microservice*) con procedimiento almacenado (`sp_ingest_recording`), vistas
(`v_recording_catalog`, `v_recording_detail`, `v_recent_history`), función
(`fn_progress_percentage`) y trigger (`trg_update_view_counters`).
