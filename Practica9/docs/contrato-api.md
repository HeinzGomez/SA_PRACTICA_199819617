# Contrato REST, eventos del bus y colas RPC

<!-- HeinzGomez - Práctica 9: contrato consumido por el frontend (API Gateway) y mensajes de RabbitMQ -->

El frontend en Vercel consume **exactamente este contrato** mediante `frontend/lib/http-api.ts`, con `NEXT_PUBLIC_API_URL` como URL base del API Gateway. No existe una implementación alternativa: si la variable no está definida se avisa en consola y las llamadas se hacen al mismo origen, que solo sirve el HTML de Next.js.

## Endpoints del API Gateway

Cada llamada HTTP se traduce en **una operación RPC** publicada en el exchange `academix.rpc` con la *routing key* indicada; la respuesta vuelve en la cola `replyTo` del Gateway con el mismo `correlationId`.

| Método | Ruta | Auth | Routing key (operación RPC) | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `auth.register` | 201 `{token, usuario}` |
| POST | `/api/auth/login` | — | `auth.login` | 200 `{token, usuario}` · 401 |
| GET | `/api/auth/me` | JWT | `auth.validate_token` | 200 `usuario` |
| GET | `/api/eventos?curso&tipo&desde&hasta` | — | `talleres.listar_eventos` | 200 `Evento[]` |
| GET | `/api/eventos/:id` | — | `talleres.obtener_evento` | 200 · 404 |
| GET | `/api/eventos/cupos?ids=a,b` | — | `talleres.obtener_cupos` | 200 `Cupo[]` |
| GET | `/api/eventos/cupos/stream` | — | `talleres.obtener_cupos` cada 2 s | SSE `event: cupos` |
| POST / PUT / DELETE | `/api/eventos[/:id]` | JWT admin | `talleres.crear_evento` / `talleres.actualizar_evento` / `talleres.eliminar_evento` | 201 / 200 / 204 · 403 · 409 |
| POST | `/api/reservas` `{evento_id, tipo}` | JWT estudiante | `reservas.solicitar` | **202** `Ticket` + `Location` · 429 · 503 |
| GET | `/api/reservas/:ticketId` | JWT | `reservas.consultar_ticket` | 200 · 404 |
| GET | `/api/reservas` | JWT | `reservas.listar_usuario` | 200 `Ticket[]` |
| GET | `/api/examenes/:eventoId` | JWT | `certificados.obtener_examen` | 200 · 409 sin reserva confirmada |
| POST | `/api/examenes/:eventoId` `{respuestas:{p:o}}` | JWT | `certificados.rendir_examen` | 200 · 409 · 429 intentos |
| GET | `/api/examenes/:eventoId/admin` | JWT admin | `certificados.obtener_examen_admin` | 200 `Examen` con `es_correcta` · 404 sin examen |
| POST | `/api/examenes` `{evento_id, titulo, puntaje_minimo?, estado?}` | JWT admin | `certificados.crear_examen` | 201 `Examen` · 400 · 409 ya existe |
| POST | `/api/examenes/:idExamen/preguntas` `{enunciado, opciones[], punteo?}` | JWT admin | `certificados.agregar_pregunta` | 201 `Pregunta` · 400 · 404 examen inexistente |
| POST | `/api/certificados` `{evento_id}` | JWT | `talleres.obtener_evento` + `certificados.generar_certificado` | 201 · 409 no aprobado |
| GET | `/api/certificados?curso&desde&hasta` | JWT | `certificados.listar_certificados` | 200 |
| GET | `/api/certificados/verificar/:codigo` | — (pública) | `certificados.verificar_certificado` | 200 `{valido, mensaje, certificado}` |

Mapeo de errores del bus → HTTP: `INVALID_ARGUMENT` 400 · `UNAUTHENTICATED` 401 · `PERMISSION_DENIED` 403 · `NOT_FOUND` 404 · `ALREADY_EXISTS` / `FAILED_PRECONDITION` 409 · `RESOURCE_EXHAUSTED` 429 · `UNAVAILABLE` 503 · `INTERNAL` 500.

## Colas RPC (exchange `academix.rpc`, direct, durable)

| Cola | Operaciones | DLQ |
|---|---|---|
| `auth.rpc` | `auth.register` · `auth.login` · `auth.validate_token` | `auth.rpc.dlq` |
| `talleres.rpc` | `talleres.listar_eventos` · `talleres.obtener_evento` · `talleres.obtener_cupos` · `talleres.crear_evento` · `talleres.actualizar_evento` · `talleres.eliminar_evento` | `talleres.rpc.dlq` |
| `reservas.rpc` | `reservas.solicitar` · `reservas.consultar_ticket` · `reservas.listar_usuario` | `reservas.rpc.dlq` |
| `certificados.rpc` | `certificados.obtener_examen` · `certificados.rendir_examen` · `certificados.generar_certificado` · `certificados.listar_certificados` · `certificados.verificar_certificado` · `certificados.crear_examen` · `certificados.agregar_pregunta` | `certificados.rpc.dlq` |

Envoltorio de la respuesta (en la cola `replyTo` del solicitante):

```json
{ "ok": true,  "datos": { } }
{ "ok": false, "error": { "codigo": "FAILED_PRECONDITION", "mensaje": "…" } }
```

El ACK del mensaje se confirma **después** de publicar la respuesta; si la publicación falla o la operación no existe, el mensaje va a la DLQ del servicio en vez de perderse.

## Estados del ticket

`PENDIENTE` → `CONFIRMADA` | `RECHAZADA` (motivo `SIN_CUPO`, `RESERVA_DUPLICADA`, `EVENTO_NO_EXISTE`, `ERROR_INTERNO`).

## Mensajes en RabbitMQ

Exchange `academix.events` (topic, durable). Mensajes JSON persistentes:

```json
{ "ticketId": "TKT-3F9A1C0B2D4E", "usuarioId": "…", "eventoId": "evt-k8s-01",
  "tipo": "ACREDITACION", "estado": "CONFIRMADA", "motivo": "", "cupoRestante": 38,
  "timestamp": "2026-10-01T15:00:02Z" }
```

| Routing key | Productor | Cola | Consumidor |
|---|---|---|---|
| `reserva.solicitada` | Reservas | `reservas.solicitudes` (DLX `academix.dlx` → `reservas.solicitudes.dlq`) | Workers de Reservas (Go) |
| `reserva.confirmada` | Workers de Reservas | `talleres.cupos` | Talleres (persiste cupo) |
| `reserva.confirmada` | Workers de Reservas | `certificados.inscripciones` | Certificados (habilita examen) |
| `reserva.rechazada` | Workers de Reservas | — (disponible para notificaciones) | — |

## Claves de Redis

| Clave | Tipo | Escribe | Lee |
|---|---|---|---|
| `cupo:evento:{id}` | string (contador) | Talleres (`SET NX`, `INCRBY`), Reservas (`DECR` en Lua) | Talleres (`MGET`) |
| `inscritos:evento:{id}` | set | Reservas (`SADD` en Lua) | Reservas (`SISMEMBER`) |

## Diploma digital

Payload canónico (JSON con claves ordenadas, sin espacios): `curso_codigo, emisor, emitido_en, evento_id, evento_titulo, id, nombre_estudiante, nota, usuario_id`. `codigo_hash = SHA-256(payload)`; `firma = Ed25519(payload)` en el backend. La verificación recalcula el hash y valida la firma: cualquier alteración del registro lo invalida. El hash y la firma se calculan y validan en `services/certificados-service` (Python, `json.dumps(..., sort_keys=True)` + SHA-256 + Ed25519); el frontend solo los muestra y consulta `GET /api/certificados/verificar/:codigo`, nunca los recomputa.
