# ENDPOINTS — API Gateway

Documentación de los endpoints expuestos actualmente por el **api-gateway**.

- **Base URL (Docker):** `http://localhost:3000`
- **Base URL (desarrollo local):** `http://localhost:4000` (depende de `GATEWAY_PORT`)
- **Formato:** JSON (`Content-Type: application/json`)
- **Convención:** los nombres de campo son `snake_case` (el cliente gRPC usa `keepCase: true`).

---

## Autenticación

El gateway monta las rutas del servicio de autenticación bajo el prefijo **`/auth`**.

### 1. Registrar usuario

`POST /auth/registrar`

**Cuerpo (JSON):**

| Campo      | Tipo   | Descripción                                          |
|------------|--------|------------------------------------------------------|
| `nombre`   | string | Nombre del usuario                                   |
| `apellido` | string | Apellido del usuario                                 |
| `correo`   | string | Correo institucional (`@ingenieria.usac.edu.gt`) |
| `password` | string | Contraseña (se hashea en el servidor)                |

**Respuesta 201 (éxito):**

```json
{
  "exito": true,
  "mensaje": "...",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Ana",
    "apellido": "López",
    "correo_institucional": "ana@ingenieria.usac.edu.gt",
    "estado": "ACTIVO",
    "fecha_registro": "2026-08-04 10:00:00"
  }
}
```

**Errores:** `400` (datos inválidos), `409` (correo ya registrado), `503` (servicio no disponible).

---

### 2. Iniciar sesión (login)

`POST /auth/login`

**Cuerpo (JSON):**

| Campo      | Tipo   | Descripción        |
|------------|--------|--------------------|
| `correo`   | string | Correo institucional |
| `password` | string | Contraseña         |

**Respuesta 200 (éxito):**

```json
{
  "exito": true,
  "mensaje": "...",
  "access_token": "<jwt>",
  "refresh_token": "<token>",
  "sesion": {
    "id_sesion": 10,
    "id_usuario": 1,
    "fecha_creacion": "2026-08-04 10:30:00",
    "fecha_expiracion": "2026-08-04 11:30:00",
    "estado": "ACTIVA"
  }
}
```

**Errores:** `400` (datos inválidos), `401` (credenciales incorrectas), `503` (servicio no disponible).

---

### 3. Cerrar sesión (logout) — *requiere autenticación*

`POST /auth/logout`

**Autenticación:** `Authorization: Bearer <access_token>` **o** cookie `access_token=<jwt>`.

**Cuerpo:** vacío (la sesión a cerrar se toma del token).

**Respuesta 200 (éxito):**

```json
{
  "exito": true,
  "mensaje": "..."
}
```

**Errores:** `401` (sin token o sin sesión activa), `503` (servicio no disponible).

---

### 4. Validar sesión — *requiere autenticación*

`GET /auth/validar`

**Autenticación:** `Authorization: Bearer <access_token>` **o** cookie `access_token=<jwt>`.

**Query params:** ninguno.

**Respuesta 200 (éxito):**

```json
{
  "exito": true,
  "mensaje": "Sesión válida",
  "sesion": {
    "id_sesion": 10,
    "id_usuario": 1,
    "fecha_creacion": "2026-08-04 10:30:00",
    "fecha_expiracion": "2026-08-04 11:30:00",
    "estado": "ACTIVA"
  },
  "usuario": {
    "id_usuario": 1,
    "nombre": "Ana",
    "apellido": "López",
    "correo_institucional": "ana@ingenieria.usac.edu.gt",
    "estado": "ACTIVO",
    "fecha_registro": "2026-08-04 10:00:00"
  }
}
```

**Errores:** `401` (token ausente, inválido o expirado), `503` (servicio no disponible).

---

### 5. Consultar auditoría — *requiere autenticación*

`GET /auth/audit`

**Autenticación:** `Authorization: Bearer <access_token>` **o** cookie `access_token=<jwt>`.

**Query params (opcionales):**

| Param           | Tipo   | Default | Descripción                                  |
|-----------------|--------|---------|----------------------------------------------|
| `pagina`        | int    | `1`     | Página a consultar (10 registros por página) |
| `usuario_filtro`| int    | `0`     | Filtra por usuario responsable (`0` = todos) |
| `tabla_filtro`  | string | `""`    | Filtra por tabla afectada (`""` = todas)     |

**Respuesta 200 (éxito):**

```json
{
  "exito": true,
  "mensaje": "...",
  "registros": [
    {
      "id_auditoria": 1,
      "usuario_responsable": 1,
      "operacion": "INSERT",
      "tabla_afectada": "usuario",
      "fecha_evento": "2026-08-04 10:00:00",
      "estado_anterior": "{}",
      "estado_nuevo": "{\"nombre\":\"Ana\"}"
    }
  ],
  "total_paginas": 1
}
```

**Errores:** `400` (parámetros inválidos), `401` (token ausente, inválido o expirado), `503` (servicio no disponible).

---

## Autenticación de endpoints protegidos

Los endpoints marcados como *requiere autenticación* aceptan el token de dos formas:

1. **Header:** `Authorization: Bearer <access_token>`
2. **Cookie:** `Cookie: access_token=<access_token>`

El middleware (`AuthMiddlewareImp`) valida el token llamando al microservicio de autenticación vía gRPC (`ValidarSesion`).

---

## Códigos de error comunes

| Código HTTP | Significado                                                            |
|-------------|------------------------------------------------------------------------|
| `400`       | Datos de entrada inválidos (`INVALID_ARGUMENT`)                        |
| `401`       | No autenticado: sin token, token inválido/expirado o credenciales malas (`UNAUTHENTICATED`) |
| `409`       | Conflicto, p. ej. correo ya registrado (`ALREADY_EXISTS`)              |
| `503`       | Microservicio de autenticación no disponible (`UNAVAILABLE`)           |
| `500`       | Error interno no clasificado                                           |

Formato de error:

```json
{
  "exito": false,
  "mensaje": "<descripción>"
}
```

---

## Notas

- No hay endpoints de salud expuestos por el gateway todavía.
- El microservicio de autenticación expone `GET /health` en su propio puerto HTTP (`3001`), no vía gateway.
- A medida que se integren los demás microservicios (inscripción, grabaciones, analítica, historial, notificaciones) se agregarán sus rutas bajo sus respectivos prefijos.
