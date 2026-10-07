# Entregable 6 — Suites de pruebas unitarias

<!-- HeinzGomez - Práctica 7: resumen de las suites, cobertura y cómo ejecutarlas -->

**95 pruebas** en 6 suites, con los frameworks obligatorios del enunciado: `go test` (Go), **Jest** (TypeScript) y **pytest** (Python). La lógica de negocio depende de interfaces (repositorios, cola, caché), por lo que las pruebas usan dobles en memoria y no requieren infraestructura; la única excepción es la prueba del script Lua, que corre contra Redis real en el pipeline y se omite localmente si no existe `REDIS_ADDR`.

| Suite | Framework | Pruebas | Cobertura (sentencias) |
|---|---|---|---|
| `services/reservas-service` | go test (`-race`) | 19 | grpcapi 100 % · service 93,5 % · worker 93,5 % |
| `services/auth-service` | Jest + ts-jest | 9 | 100 % |
| `services/talleres-service` | Jest + ts-jest | 14 | 99,3 % |
| `services/api-gateway` | Jest + supertest | 20 | 99,1 % |
| `services/certificados-service` | pytest + pytest-cov | 13 | 95 % |
| `frontend` | Jest + ts-jest | 20 | 87 % (`lib/`) |

Se excluyen de la cobertura los puntos de arranque (`server.ts`, `main.go`, `main.py`) y los adaptadores de infraestructura que solo envuelven drivers (Postgres, AMQP).

## Qué se prueba (por caso de uso)

| Caso de uso | Pruebas representativas |
|---|---|
| CDU 1.2 / 1.3 Registro y login | correo institucional, carnet de 9 dígitos, contraseña robusta, duplicados, mensaje genérico ante credenciales erróneas, JWT alterado |
| CDU 2.1 / 2.2 Catálogo y filtros | filtro por curso, tipo y rango de fechas (hasta inclusivo), orden cronológico |
| CDU 2.4 Cupo en tiempo real | cupo leído del contador de Redis, degradación a Postgres si Redis falla, SSE del Gateway |
| CDU 2.6 – 2.8 Administración | solo rol administrador, ajuste del cupo vivo por delta, no reducir cupo bajo las reservas confirmadas, no eliminar con reservas |
| CDU 3.1 Productor | ticket `PENDIENTE`, publicación `reserva.solicitada`, **compensación** a `RECHAZADA` si el broker falla, respuesta **202** con `Location`, 503 si el broker cae, rate-limit 429 |
| CDU 3.3 Consumidor | confirmación con descuento de cupo, `SIN_CUPO`, `RESERVA_DUPLICADA`, `EVENTO_NO_EXISTE`, **idempotencia ante re-entrega**, mensajes corruptos a la DLQ |
| Ráfaga concurrente | **500 estudiantes, 50 cupos, 16 consumidores concurrentes ⇒ exactamente 50 confirmadas** (con `-race`); script Lua con 100 goroutines contra Redis real |
| CDU 3.6 Examen | requiere reserva confirmada, no expone respuestas correctas, límite de 3 intentos, no repetir si ya aprobó |
| CDU 3.7 Diploma | requiere examen aprobado, idempotente, firma Ed25519 válida |
| CDU 4.1 – 4.4 Consulta y verificación | filtros por curso/fecha, verificación por id o hash (mayúsculas/minúsculas), **detección de alteración** del registro |
| Contratos | servidor gRPC real en proceso (Python), mapeo de códigos gRPC ↔ HTTP, mismo SHA-256 en Python y en el navegador |

## Ejecución

```bash
./scripts/test-all.sh           # todas las suites
```

```powershell
.\scripts\test-all.ps1
```

Por servicio:

```bash
cd services/reservas-service && go test -race -cover ./...
cd services/auth-service && npm ci && npm test
cd services/certificados-service && pip install -r requirements-dev.txt && pytest --cov=app
cd frontend && npm ci && npm test
```

## Evidencia

- Salida de las suites en el pipeline (artifacts `cobertura-*`): 
  - [![image.png](https://i.postimg.cc/YCsdQ91C/image.png)](https://postimg.cc/LJjkpmCc)
