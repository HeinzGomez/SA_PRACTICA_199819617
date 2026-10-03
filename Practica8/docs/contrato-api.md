# Contrato REST, eventos del bus y mocks

<!-- HeinzGomez - Práctica 7: contrato consumido por el frontend (API Gateway) y mensajes de RabbitMQ -->

El frontend en Vercel consume **exactamente este contrato**. Con `NEXT_PUBLIC_API_URL` lo hace contra el API Gateway real (`frontend/lib/http-api.ts`); sin esa variable usa la implementación mock (`frontend/lib/mock-api.ts`), que reproduce las mismas reglas de negocio, códigos HTTP y la asincronía de la cola.

## Endpoints del API Gateway

| Método | Ruta | Auth | gRPC destino | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `AuthService.Register` | 201 `{token, usuario}` |
| POST | `/api/auth/login` | — | `AuthService.Login` | 200 `{token, usuario}` · 401 |
| GET | `/api/auth/me` | JWT | `AuthService.ValidateToken` | 200 `usuario` |
| GET | `/api/eventos?curso&tipo&desde&hasta` | — | `TalleresService.ListarEventos` | 200 `Evento[]` |
| GET | `/api/eventos/:id` | — | `TalleresService.ObtenerEvento` | 200 · 404 |
| GET | `/api/eventos/cupos?ids=a,b` | — | `TalleresService.ObtenerCupos` | 200 `Cupo[]` |
| GET | `/api/eventos/cupos/stream` | — | `ObtenerCupos` cada 2 s | SSE `event: cupos` |
| POST / PUT / DELETE | `/api/eventos[/:id]` | JWT admin | `Crear/Actualizar/EliminarEvento` | 201 / 200 / 204 · 403 · 409 |
| POST | `/api/reservas` `{evento_id, tipo}` | JWT estudiante | `ReservasService.SolicitarReserva` | **202** `Ticket` + `Location` · 429 · 503 |
| GET | `/api/reservas/:ticketId` | JWT | `ReservasService.ConsultarTicket` | 200 · 404 |
| GET | `/api/reservas` | JWT | `ReservasService.ListarReservasUsuario` | 200 `Ticket[]` |
| GET | `/api/examenes/:eventoId` | JWT | `CertificadosService.ObtenerExamen` | 200 · 409 sin reserva confirmada |
| POST | `/api/examenes/:eventoId` `{respuestas:{p:o}}` | JWT | `CertificadosService.RendirExamen` | 200 · 409 · 429 intentos |
| POST | `/api/certificados` `{evento_id}` | JWT | `ObtenerEvento` + `GenerarCertificado` | 201 · 409 no aprobado |
| GET | `/api/certificados?curso&desde&hasta` | JWT | `ListarCertificados` | 200 |
| GET | `/api/certificados/verificar/:codigo` | — (pública) | `VerificarCertificado` | 200 `{valido, mensaje, certificado}` |

Mapeo de errores gRPC → HTTP: `INVALID_ARGUMENT` 400 · `UNAUTHENTICATED` 401 · `PERMISSION_DENIED` 403 · `NOT_FOUND` 404 · `ALREADY_EXISTS` / `FAILED_PRECONDITION` 409 · `RESOURCE_EXHAUSTED` 429 · `UNAVAILABLE` 503.

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
| `reserva.solicitada` | Reservas (gRPC) | `reservas.solicitudes` (DLX `academix.dlx` → `reservas.solicitudes.dlq`) | Workers de Reservas (Go) |
| `reserva.confirmada` | Workers de Reservas | `talleres.cupos` | Talleres (persiste cupo) |
| `reserva.confirmada` | Workers de Reservas | `certificados.inscripciones` | Certificados (habilita examen) |
| `reserva.rechazada` | Workers de Reservas | — (disponible para notificaciones) | — |

## Claves de Redis

| Clave | Tipo | Escribe | Lee |
|---|---|---|---|
| `cupo:evento:{id}` | string (contador) | Talleres (`SET NX`, `INCRBY`), Reservas (`DECR` en Lua) | Talleres (`MGET`) |
| `inscritos:evento:{id}` | set | Reservas (`SADD` en Lua) | Reservas (`SISMEMBER`) |

## Diploma digital

Payload canónico (JSON con claves ordenadas, sin espacios): `curso_codigo, emisor, emitido_en, evento_id, evento_titulo, id, nombre_estudiante, nota, usuario_id`. `codigo_hash = SHA-256(payload)`; `firma = Ed25519(payload)` en el backend (HMAC-SHA256 en el mock, para no exponer una llave privada en el navegador). La verificación recalcula el hash y valida la firma: cualquier alteración del registro lo invalida. El mismo payload produce el mismo hash en Python y en el frontend (lo comprueba una prueba unitaria).
