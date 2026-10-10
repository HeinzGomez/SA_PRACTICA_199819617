# YOUSAC Academix Pass & CertiHub — Mini-proyecto (Práctica 9)

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
    │   ├── auth-service/          TypeScript (registro, login, JWT)   cola auth.rpc
    │   ├── talleres-service/      TypeScript (catálogo, CRUD, cupo)    cola talleres.rpc
    │   ├── reservas-service/      Go (ticketing, productor/worker)    cola reservas.rpc
    │   └── certificados-service/  Python (examen, diploma Ed25519)    cola certificados.rpc
    ├── frontend/                  Next.js 15 (desplegado en Vercel)
    ├── infra/postgres/init.sql    Una base de datos por servicio
    ├── docker-compose.yml         Entorno completo de desarrollo
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
