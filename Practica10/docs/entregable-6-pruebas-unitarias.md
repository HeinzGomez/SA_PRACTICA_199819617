# Entregable 6 — Suites de pruebas unitarias

<!-- HeinzGomez - Práctica 7: resumen de las suites, cobertura y cómo ejecutarlas -->

**440 pruebas** en 6 suites, con los frameworks obligatorios del enunciado: `go test` (Go), **Jest** (TypeScript) y **pytest** (Python). La lógica de negocio depende de interfaces (repositorios, cola, caché), por lo que las pruebas usan dobles en memoria y no requieren infraestructura; la única excepción es la prueba del script Lua, que corre contra Redis real en el pipeline y se omite localmente si no existe `REDIS_ADDR`.

| Suite | Framework | Pruebas | Cobertura |
|---|---|---|---|
| `services/reservas-service` | go test | 68 | domain 100 % · config 100 % · rpcapi 100 % · worker 93,5 % · service 93,5 % · store 83,7 % |
| `services/auth-service` | Jest + ts-jest | 77 | 89,5 % |
| `services/talleres-service` | Jest + ts-jest | 89 | 96,9 % |
| `services/api-gateway` | Jest + supertest | 100 | 100 % (sentencias y líneas) · 90,1 % (ramas) · 97,5 % (funciones) |
| `services/certificados-service` | pytest + pytest-cov | 90 | 100 % (sentencias y ramas) |
| `frontend` | Jest + ts-jest | 16 | 87 % (`lib/`) |

Se excluyen de la cobertura los puntos de arranque (`server.ts`, `main.go`) y los bucles `iniciar()` de los consumidores, que solo corren contra un RabbitMQ vivo: esa parte queda para la prueba de integración. En Go la métrica es **por paquete**, igual que en el pipeline; en Python se mide **por ramas** con un mínimo del 70 % (`.coveragerc`), y la suite corre en un solo proceso para que use ~50 MB de RAM (`pytest.ini`); en Node, Jest corre con **`maxWorkers: 1`** y un umbral global del 70 % (`package.json`), y sus ramas sin cubrir son los respaldos `?? {}`/`?.` que el parser estricto de Express impide alcanzar.

## Qué se prueba (por caso de uso)

| Caso de uso | Pruebas representativas |
|---|---|
| CDU 1.2 / 1.3 Registro y login | correo institucional, carnet de 9 dígitos, contraseña robusta, duplicados, mensaje genérico ante credenciales erróneas, JWT alterado |
| CDU 2.1 / 2.2 Catálogo y filtros | filtro por curso, tipo y rango de fechas (hasta inclusivo), orden cronológico |
| CDU 2.4 Cupo en tiempo real | cupo leído del contador de Redis, degradación a Postgres si Redis falla, SSE del Gateway |
| CDU 2.6 – 2.8 Administración | solo rol administrador, ajuste del cupo vivo por delta, no reducir cupo bajo las reservas confirmadas, no eliminar con reservas |
| CDU 3.1 Productor | ticket `PENDIENTE`, publicación `reserva.solicitada`, **compensación** a `RECHAZADA` si el broker falla, respuesta **202** con `Location`, 503 si el broker cae, rate-limit 429 |
| CDU 3.3 Consumidor | confirmación con descuento de cupo, `SIN_CUPO`, `RESERVA_DUPLICADA`, `EVENTO_NO_EXISTE`, **idempotencia ante re-entrega**, mensajes corruptos a la DLQ |
| Ráfaga concurrente | **500 estudiantes, 50 cupos, 16 consumidores concurrentes ⇒ exactamente 50 confirmadas** (el detector de carreras corre en el pipeline); script Lua con 100 goroutines contra Redis real |
| CDU 3.6 Examen | requiere reserva confirmada, no expone respuestas correctas, límite de 3 intentos, no repetir si ya aprobó |
| CDU 3.7 Diploma | requiere examen aprobado, idempotente, firma Ed25519 válida |
| CDU 4.1 – 4.4 Consulta y verificación | filtros por curso/fecha, verificación por id o hash (mayúsculas/minúsculas), **detección de alteración** del registro |
| Contratos | envoltorio `{ok, datos}` / `{ok, error}` de la cola RPC, mapeo de códigos ↔ HTTP, mismo SHA-256 en Python y en el navegador |

## Ejecución

```bash
./scripts/test-all.sh           # todas las suites
```

El script de Go usa `GOMAXPROCS=1 -p 1 -parallel 1` y no `-race` para caber en una máquina pequeña. Para la corrida con detector de carreras:

```bash
cd services/reservas-service && go test -race -cover ./...
```

```powershell
.\scripts\test-all.ps1
```

Por servicio:

```bash
cd services/reservas-service && GOMAXPROCS=1 go test -p 1 -parallel 1 -count=1 -cover ./...
cd services/auth-service && npm ci && npm test
cd services/api-gateway && npm ci && npm test
cd services/certificados-service && pip install -r requirements-dev.txt && pytest --cov=app --cov-report=term
cd frontend && npm ci && npm test
```

## Evidencia

- Salida de las suites en el pipeline (artifacts `cobertura-*`): 
  - [![image.png](https://i.postimg.cc/YCsdQ91C/image.png)](https://postimg.cc/LJjkpmCc)
