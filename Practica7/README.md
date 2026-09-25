# YOUSAC Academix Pass & CertiHub — Mini-proyecto (Práctica 7)

<!-- HeinzGomez - Práctica 7: README del mini-proyecto (entregables 3 a 6) -->

Sistema satélite de YOUSAC para la **inscripción en ráfaga** a talleres, conferencias, laboratorios y exámenes de certificación, y para la **emisión y verificación pública de diplomas digitales firmados**. Está construido con una **Arquitectura Orientada a Servicios (SOA)**: los servicios de negocio se comunican por **gRPC** (contratos Protocol Buffers) y las transacciones críticas se desacoplan con **RabbitMQ**.

| Entregable | Dónde está |
|---|---|
| 3. Código fuente del Backend y Frontend | `services/`, `frontend/`, `proto/` |
| 4. Pipeline de CI (YAML) | `.github/workflows/ci.yml` · [docs/entregable-4-pipeline-ci.md](docs/entregable-4-pipeline-ci.md) |
| 5. Perfil de Container Registry | [docs/entregable-5-container-registry.md](docs/entregable-5-container-registry.md) · `docker-compose.registry.yml` |
| 6. Suites de pruebas unitarias | `*/tests`, `*_test.go` · [docs/entregable-6-pruebas-unitarias.md](docs/entregable-6-pruebas-unitarias.md) |
| Contrato REST, eventos y mocks | [docs/contrato-api.md](docs/contrato-api.md) |

## Arquitectura

```
                    Vercel (*.vercel.app)
                ┌──────────────────────────┐
                │  Frontend Next.js 15     │  modo mock (por defecto) ──► lib/mock-api.ts
                └────────────┬─────────────┘  modo api (NEXT_PUBLIC_API_URL)
                             │ HTTPS/JSON + SSE
                ┌────────────▼─────────────┐
                │  API Gateway (Express)   │  JWT · CORS · rate-limit · 202 Accepted
                └──┬────────┬────────┬─────┘
             gRPC  │        │        │        │ gRPC
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
                                │   │ RabbitMQ  exchange academix.events │
                                │   │  reserva.solicitada → reservas.solicitudes (+DLQ)
                                └───┤  reserva.confirmada → talleres.cupos
                                    │  reserva.confirmada → certificados.inscripciones
                                    └────────────────────────────────────┘
```

**Flujo de reserva (asíncrono):** el estudiante pulsa *Reservar* → el Gateway valida el JWT y llama `SolicitarReserva` (gRPC) → el Servicio de Reservas guarda el ticket `PENDIENTE`, publica `reserva.solicitada` y responde **202** de inmediato → N consumidores Go toman los mensajes y ejecutan un **script Lua atómico en Redis** (descuenta cupo, evita duplicados) → el ticket pasa a `CONFIRMADA` o `RECHAZADA` y se publica `reserva.confirmada` → Talleres persiste el cupo y Certificados habilita el examen. El frontend consulta el ticket y muestra el cupo en vivo por SSE.

## Estructura

```
MiniProyecto/
├── proto/                     Contratos gRPC (auth, talleres, reservas, certificados)
├── services/
│   ├── api-gateway/           Express + TypeScript (REST → gRPC, SSE de cupos)
│   ├── auth-service/          TypeScript (registro, login, JWT)            :50051
│   ├── talleres-service/      TypeScript (catálogo, CRUD, cupo en Redis)   :50052
│   ├── reservas-service/      Go (ticketing, productor/consumidor RabbitMQ):50053
│   └── certificados-service/  Python (examen, diploma firmado Ed25519)     :50054
├── frontend/                  Next.js 15 (desplegado en Vercel)
├── infra/postgres/init.sql    Una base de datos por servicio
├── docker-compose.yml         Entorno completo de desarrollo
├── docker-compose.registry.yml  Mismo entorno usando las imágenes de GHCR
├── scripts/test-all.(sh|ps1)  Ejecuta todas las suites de pruebas
└── .github/workflows/ci.yml   Pipeline de CI
```

## Ejecución local

```bash
# Todo el sistema (Postgres, Redis, RabbitMQ, 5 servicios, frontend)
docker compose up --build
# Frontend http://localhost:3000 · Gateway http://localhost:8080 · RabbitMQ http://localhost:15672
```

Cuentas iniciales: `admin@ingenieria.usac.edu.gt / Admin12345` (administrador). Los estudiantes se registran con correo `@ingenieria.usac.edu.gt` o `@usac.edu.gt`.

Solo el frontend con mocks:

```bash
cd frontend && npm install && npm run dev      # http://localhost:3000
```

Cuentas del mock: `demo@ingenieria.usac.edu.gt / Demo12345` (estudiante) y `admin@ingenieria.usac.edu.gt / Admin12345`. Diploma de ejemplo para verificar: `CERT-DEMO000001`.

## Despliegue del frontend en Vercel

1. En Vercel: **Add New → Project → Import** el repositorio de GitHub.
2. **Root Directory:** `frontend` (si el repositorio contiene la carpeta `MiniProyecto`, usar `MiniProyecto/frontend`). Framework: Next.js (se detecta solo).
3. Variables de entorno: ninguna para el modo mock. Para apuntar a un backend real, `NEXT_PUBLIC_API_URL=https://<gateway>`.
4. Deploy. Cada push a `main` genera un despliegue de producción y cada PR un *preview*.

## Pruebas

```bash
./scripts/test-all.sh          # Linux / macOS / Git Bash
.\scripts\test-all.ps1         # Windows PowerShell
```

95 pruebas unitarias en 6 suites (Go, Jest ×4, pytest). Detalle en [docs/entregable-6-pruebas-unitarias.md](docs/entregable-6-pruebas-unitarias.md).

## Notas

- **Go (`reservas-service`)**: antes del primer commit ejecutar `go mod tidy` dentro de `services/reservas-service` para generar `go.sum` y versionarlo. El Dockerfile y el pipeline lo resuelven si falta, pero es buena práctica commitearlo.
- Los stubs Python de gRPC (`services/certificados-service/app/gen`) se regeneran con `gen_proto.sh`; el pipeline y el Dockerfile lo hacen automáticamente.
- Secretos (`JWT_SECRET`, `CERT_SIGNING_SEED`, contraseñas) se pasan por variables de entorno; los valores de `docker-compose.yml` son solo para desarrollo.
