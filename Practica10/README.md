# YOUSAC Academix Pass & CertiHub — Mini-proyecto (Práctica 10)

**Frontend en Vercel:**
https://sa-practica-199819617-r9295g3sg-usac3.vercel.app

Sistema satélite de YOUSAC para la **inscripción en ráfaga** a talleres, conferencias, laboratorios y exámenes de certificación, y para la **emisión y verificación pública de diplomas digitales firmados**. Está construido con una **Arquitectura Orientada a Servicios (SOA)**: el API Gateway y los servicios de negocio se comunican por **RPC sobre RabbitMQ** (una cola por servicio y cola de respuesta) y las transacciones críticas se desacoplan con **eventos** en el mismo broker. Los payloads están documentados en [docs/contrato-api.md](docs/contrato-api.md): ya no hay contratos `.proto` ni gRPC, el flujo es **frontend → API Gateway → servicios** y el transporte entre Gateway y servicios es el broker (RPC por cola).

| Entregable | Dónde está |
|---|---|
| 3. Código fuente del Backend y Frontend | `services/`, `frontend/` · contrato: [docs/contrato-api.md](docs/contrato-api.md) |
| 4. Pipeline de CI (YAML) | `.github/workflows/ci-practica7.yml` (raíz del repositorio) · [docs/entregable-4-pipeline-ci.md](docs/entregable-4-pipeline-ci.md) |
| 5. Perfil de Container Registry | [docs/entregable-5-container-registry.md](docs/entregable-5-container-registry.md) · `docker-compose.registry.yml` |
| 6. Suites de pruebas unitarias | `*/tests`, `*_test.go` · [docs/entregable-6-pruebas-unitarias.md](docs/entregable-6-pruebas-unitarias.md) |
| Contrato REST, eventos y colas RPC | [docs/contrato-api.md](docs/contrato-api.md) |

## Arquitectura

```
                    Vercel (*.vercel.app)
                ┌──────────────────────────┐
                │  Frontend Next.js 15     │  lib/http-api.ts (única implementación)
                └────────────┬─────────────┘  NEXT_PUBLIC_API_URL → API Gateway
                             │ HTTPS/JSON + SSE
                ┌────────────▼─────────────┐
                │  API Gateway (Express)   │  JWT · CORS · rate-limit · 202 Accepted
                └──┬────────┬────────┬─────┘
                   │        │        │        │   RPC sobre RabbitMQ
                   │        │        │        │   (exchange academix.rpc -> cola <servicio>.rpc,
                   │        │        │        │    respuesta en la cola replyTo del gateway)
      ┌────────────▼┐ ┌─────▼──────┐ ┌▼─────────────┐ ┌▼──────────────────┐
      │ auth (TS)   │ │ talleres   │ │ reservas (Go)│ │ certificados (Py) │
      │ JWT/bcrypt  │ │ (TS)       │ │ productor +  │ │ examen · Ed25519  │
      └─────┬───────┘ └──┬──────▲──┘ │ consumidores │ └───┬──────────▲────┘
            │            │      │    └─┬──────▲─────┘     │          │
         auth_db    talleres_db │      │      │      certificados_db │
                         │      │      │ Lua  │                      │
                         └──► Redis ◄──┘ atómico                     │
                                │      │      │                      │
                                │   ┌──▼──────┴──────────────────────┴──┐
                                │   │ RabbitMQ                          │
                                │   │  academix.rpc   -> peticiones RPC │
                                └───┤  academix.events -> dominio       │
                                    │   reserva.solicitada -> reservas.solicitudes (+DLQ)
                                    │   reserva.confirmada -> talleres.cupos
                                    │   reserva.confirmada -> certificados.inscripciones
                                    └────────────────────────────────────┘
```

**Flujo de reserva (asíncrono):** el estudiante pulsa *Reservar* → el Gateway valida el JWT y publica `reservas.solicitar` en el bus RPC → el Servicio de Reservas guarda el ticket `PENDIENTE`, publica `reserva.solicitada` y responde **202** de inmediato → N consumidores Go toman los mensajes y ejecutan un **script Lua atómico en Redis** (descuenta cupo, evita duplicados) → el ticket pasa a `CONFIRMADA` o `RECHAZADA` y se publica `reserva.confirmada` → Talleres persiste el cupo y Certificados habilita el examen. El frontend consulta el ticket y muestra el cupo en vivo por SSE.

## Estructura

```
SA_PRACTICA_199819617/
├── .github/workflows/ci-practica7.yml   Pipeline de CI (GitHub solo lee workflows en la raíz)
└── Practica7/
    ├── services/
    │   ├── api-gateway/           Express + TypeScript (REST → RPC por el broker, SSE de cupos)
    │   ├── auth-service/          TypeScript (registro, login, JWT)   cola auth.rpc · observabilidad /health /metrics
    │   ├── talleres-service/      TypeScript (catálogo, CRUD, cupo)    cola talleres.rpc · observabilidad /health /metrics
    │   ├── reservas-service/      Go (ticketing, productor/worker)    cola reservas.rpc · observabilidad /health /metrics
    │   └── certificados-service/  Python (examen, diploma Ed25519)    cola certificados.rpc · observabilidad /health /metrics
    ├── frontend/                  Next.js 15 (desplegado en Vercel)
    ├── infra/postgres/init.sql    Una base de datos por servicio
    ├── monitoring/
    │   ├── prometheus/            prometheus.yml (scrape de cadvisor, node-exporter, RabbitMQ y API Gateway) + rules/alertas.yml
    │   └── grafana/
    │       ├── provisioning/      datasource de Prometheus y provider de tableros
    │       └── dashboards/        infraestructura.json · negocio-colas.json
    ├── docker-compose.yml         Entorno completo de desarrollo + stack de observabilidad
    ├── docker-compose.registry.yml  Mismo entorno usando las imágenes de GHCR
    └── scripts/test-all.(sh|ps1)  Ejecuta todas las suites de pruebas
```

## Ejecución local

```bash
# Todo el sistema (Postgres, Redis, RabbitMQ, 5 servicios, frontend)
docker compose up --build
# Frontend http://localhost:3000 · Gateway http://localhost:8080 · RabbitMQ http://localhost:15672
```

Cuentas iniciales: `admin@ingenieria.usac.edu.gt / Admin12345` (administrador). Los estudiantes se registran con correo `@ingenieria.usac.edu.gt` o `@usac.edu.gt`.

Solo el frontend (requiere el API Gateway corriendo, no hay datos locales):

```bash
cd frontend && npm install && cp .env.example .env.local && npm run dev   # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` (`http://localhost:8080` en docker compose) es obligatoria: sin ella el navegador llamaría al mismo origen, que solo sirve el HTML de Next.js.

## Observabilidad (Práctica 10)

El mismo `docker-compose.yml` levanta el stack de monitoreo junto con el sistema:

```bash
docker compose up -d prometheus grafana cadvisor node-exporter   # solo observabilidad
docker compose up --build                                        # sistema + observabilidad
```

| Componente | URL | Notas |
|---|---|---|
| Prometheus | http://localhost:9090 | Scrapea cAdvisor (CPU/memoria/red de los contenedores), node-exporter (nodo), el broker en `/metrics/per-object`, el API Gateway (`:8080`), el Servicio de Auth (`:8091`), el Servicio de Talleres (`:8092`), el Servicio de Reservas (`:8093`) y el Servicio de Certificados (`:8094`) en `/metrics` |
| Grafana | http://localhost:3001 | `admin/admin` (o `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD`). Acceso anónimo en rol *Viewer* habilitado |
| Métricas de RabbitMQ | http://localhost:15692/metrics/per-object | Plugin `rabbitmq_prometheus` (habilitado por defecto en la imagen) |
| cAdvisor | http://localhost:8081 | Métricas crudas de contenedores |

Tableros aprovisionados automáticamente desde `monitoring/grafana/dashboards/` (carpeta *Academix*):

1. **Infraestructura** (`/d/academix-infra`): salud de los targets/pods, consumo de CPU y memoria por contenedor, uso del nodo, tráfico de red, disco y carga.
2. **Métricas de Negocio y Colas** (`/d/academix-colas`): longitud de cola por cola, tasa de publicación/consumo, tickets emitidos y procesados acumulados, consumidores y conexiones del broker. Es el tablero usado en la **prueba de absorción de colas**: al inyectar la ráfaga contra el endpoint de reservas se ve subir la cola y drenarla con los workers.

Configuración: `monitoring/prometheus/prometheus.yml` (targets y alertas de `monitoring/prometheus/rules/alertas.yml`), `monitoring/grafana/provisioning/datasources/` y `monitoring/grafana/provisioning/dashboards/`. Tras editar, recargar con `curl -X POST http://localhost:9090/-/reload` o reiniciando el servicio.

### Instrumentación del API Gateway

El gateway (puerto `8080`) expone:

| Ruta | Uso |
|---|---|
| `GET /health` | *liveness*: responde el proceso. Es el healthcheck de Docker/K8s y no depende del broker |
| `GET /health/ready` | *readiness*: `broker=ok` si RabbitMQ es alcanzable; `503 not_ready` si no (readinessProbe de K3s) |
| `GET /metrics` | métricas Prometheus: `academix_http_requests_total`, `academix_http_request_duration_seconds`, `academix_rpc_*`, `academix_broker_connected` y las del proceso (scrapeadas por el job `api-gateway`) |

Logs en **JSON estructurado** por stdout (pino + pino-http) con `servicio`, `version`, `metodo`, `ruta` (patrón normalizado, p. ej. `/api/reservas/:ticketId`: nunca el identificador concreto), `estado`, `duracion_ms`, `usuario_id`, `rol` y `peticion_id` (se acepta `X-Request-Id` para correlación con el cliente). Las sondas `/health*` y `/metrics` no generan log ni métrica de tráfico. El nivel se controla con `LOG_LEVEL` (por defecto `info`).

```bash
curl -s http://localhost:8080/health
curl -s http://localhost:8080/metrics | grep academix_http_requests_total
docker logs -f academix-api-gateway-1          # una línea JSON por petición
```

### Instrumentación del Servicio de Auth

El servicio (Node, puerto `8091`) expone las mismas sondas que el gateway en un servidor propio (`node:http`, sin añadir express):

| Ruta | Uso |
|---|---|
| `GET /health` | *liveness*: 200 si el proceso responde. Es el healthcheck del contenedor (`node dist/observabilidad/healthcheck.js`, la imagen no trae curl) |
| `GET /health/ready` | *readiness*: 200 con `broker=ok` y `base_datos=ok`; `503 not_ready` si alguno cae (el estado del broker llega desde `ConexionBroker` y la base se sondea con `SELECT 1`) |
| `GET /metrics` | `academix_rpc_calls_total`, `academix_rpc_duration_seconds`, `academix_broker_connected`, `academix_auth_registros_total`, `academix_auth_login_total{resultado}` y las del proceso (job `auth-service`) |

Logs en **JSON por stdout** (pino) con `servicio`, `version` y campos de contexto; redacta `password`, `passwordHash` y `token`. El nivel se controla con `LOG_LEVEL`.

```bash
curl -s http://localhost:8091/health
curl -s http://localhost:8091/metrics | grep academix_auth_
docker logs -f academix-auth-service-1
```

La instrumentación vive en `services/auth-service/src/observabilidad/`: el consumidor, la conexión del broker y el controlador solo conocen el protocolo `Telemetria` (DIP) y el logger singleton; `src/app.ts` es el único que instancia Prometheus y el servidor de sondas.

### Instrumentación del Servicio de Talleres

El servicio (Node, puerto `8092`) expone las mismas sondas que el gateway en un servidor propio (`node:http`, sin añadir express):

| Ruta | Uso |
|---|---|
| `GET /health` | *liveness*: 200 si el proceso responde. Es el healthcheck del contenedor (`node dist/observabilidad/healthcheck.js`, la imagen no trae curl) |
| `GET /health/ready` | *readiness*: 200 con `broker=ok`, `base_datos=ok` y `redis=ok`; `503 not_ready` si alguno cae (el estado del broker llega desde `ConexionBroker`, Postgres se sondea con `SELECT 1` y Redis con `PING`) |
| `GET /metrics` | `academix_worker_messages_total{queue,status}`, `academix_worker_processing_duration_seconds`, `academix_worker_in_flight`, `academix_rpc_calls_total{operation,status}`, `academix_rpc_duration_seconds`, `academix_broker_connected`, `academix_talleres_cupos_sincronizados_total{resultado}` y las del proceso (job `talleres-service`) |

Logs en **JSON por stdout** (pino) con `servicio`, `version` y campos de contexto; redacta `password` y `token`. El worker deja constancia del ciclo completo de cada mensaje (`worker atendiendo petición` → `worker respondió petición` con `resultado=ack`, `worker falló la petición` con `resultado=nack-dlq` o `worker descartó petición` para JSON inválido), y el broker reporta suscripciones y reconexiones. El nivel se controla con `LOG_LEVEL`.

```bash
curl -s http://localhost:8092/health
curl -s http://localhost:8092/health/ready
curl -s http://localhost:8092/metrics | grep academix_worker_messages_total
docker logs -f academix-talleres-service-1 | grep "worker atendiendo"
```

La instrumentación vive en `services/talleres-service/src/observabilidad/`: el consumidor, la conexión del broker y los controladores solo conocen el protocolo `Telemetria` (DIP) y el logger singleton; `src/app.ts` es el único que instancia Prometheus y el servidor de sondas.

### Instrumentación del Servicio de Certificados

El servicio (Python, puerto `8094`) expone las mismas sondas que el gateway:

| Ruta | Uso |
|---|---|
| `GET /health` | *liveness*: 200 si el proceso responde. Es el healthcheck del contenedor (`python -m app.observabilidad.healthcheck`, la imagen no trae curl) |
| `GET /health/ready` | *readiness*: 200 con `broker=ok` y `postgres=ok`; `503 not_ready` si alguno cae |
| `GET /metrics` | `academix_rpc_requests_total`, `academix_rpc_duration_seconds`, `academix_broker_connected`, `academix_inscripciones_total`, `academix_examenes_total`, `academix_certificados_emitidos_total` y las del proceso (job `certificados-service`) |

Logs en **JSON** por stdout con la stdlib (sin dependencias): `timestamp`, `nivel`, `logger`, `mensaje`, `servicio` y `version`; el nivel se controla con `LOG_LEVEL`.

```bash
curl -s http://localhost:8094/health
curl -s http://localhost:8094/metrics | grep academix_rpc_requests_total
docker logs -f academix-certificados-service-1
```

La instrumentación vive en `services/certificados-service/app/observabilidad/`: el broker y el controlador solo conocen el protocolo `Telemetria` (DIP), y `app/main.py` es el único módulo que instancia Prometheus y el logging.

### Instrumentación del Servicio de Reservas

El servicio (Go, puerto `8093`) expone las mismas sondas que el gateway:

| Ruta | Uso |
|---|---|
| `GET /health` | *liveness*: 200 si el proceso responde. Es el healthcheck del contenedor (`/reservas healthcheck`, distroless no trae shell ni curl) |
| `GET /health/ready` | *readiness*: 200 con `postgres=ok`, `redis=ok` y `broker=ok`; `503 not_ready` si alguno cae |
| `GET /metrics` | `academix_worker_messages_total{queue,status}`, `academix_worker_processing_duration_seconds`, `academix_worker_in_flight`, `academix_worker_reservas_total{resultado}`, `academix_rpc_calls_total{operation,status}`, `academix_rpc_duration_seconds`, `academix_broker_connected` y las del proceso (job `reservas-service`) |

Logs en **JSON estructurado** por stdout con la stdlib (`log/slog`): el worker deja constancia del ciclo completo de cada mensaje (`worker atendiendo petición` → `worker respondió petición` con `resultado=ack`, o `worker falló la petición` con `resultado=nack-dlq` y `worker descartó petición` para JSON inválido), el adaptador RPC registra `rpc atendiendo` / `rpc respondió` con su duración, y el broker reporta suscripciones y reconexiones. El nivel se controla con `LOG_LEVEL` (por defecto `info`).

```bash
curl -s http://localhost:8093/health
curl -s http://localhost:8093/health/ready
curl -s http://localhost:8093/metrics | grep academix_worker_messages_total
docker logs -f academix-reservas-service-1 | grep "worker atendiendo"
```

La observabilidad vive en `services/reservas-service/internal/observabilidad/` (logger, métricas y servidor de sondas), el ciclo del worker en `internal/worker/worker.go` y la telemetría llega a Prometheus por las interfaces `worker.Telemetria` / `rpcapi.Telemetria` (DIP); `cmd/server/main.go` es el único que las ensambla.

## Despliegue del frontend en Vercel

1. En Vercel: **Add New → Project → Import** el repositorio de GitHub.
2. **Root Directory:** `Practica7/frontend`. Framework: Next.js (se detecta solo).
3. Variables de entorno: `NEXT_PUBLIC_API_URL=https://<gateway>` (obligatoria; el frontend solo consume el API Gateway real).
4. Deploy. Cada push a `main` genera un despliegue de producción y cada PR un *preview*.

## Pruebas

```bash
./scripts/test-all.sh          # Linux / macOS / Git Bash
.\scripts\test-all.ps1         # Windows PowerShell
```

Suites de pruebas en 6 proyectos (Go, Jest ×4, pytest). Detalle en [docs/entregable-6-pruebas-unitarias.md](docs/entregable-6-pruebas-unitarias.md).

## Notas

- **Go (`reservas-service`)**: antes del primer commit ejecutar `go mod tidy` dentro de `services/reservas-service` para generar `go.sum` y versionarlo. El Dockerfile y el pipeline lo resuelven si falta, pero es buena práctica commitearlo.
- Secretos (`JWT_SECRET`, `CERT_SIGNING_SEED`, contraseñas) se pasan por variables de entorno; los valores de `docker-compose.yml` son solo para desarrollo.
