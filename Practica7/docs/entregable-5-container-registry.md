# Entregable 5 — Perfil de Container Registry (GitHub Container Registry)

<!-- HeinzGomez - Práctica 7: imágenes publicadas por el pipeline en ghcr.io -->

Registro elegido: **GitHub Container Registry (`ghcr.io`)**. Se integra con GitHub Actions sin secretos adicionales (usa `GITHUB_TOKEN`), las imágenes quedan asociadas al repositorio y la subida es **exclusivamente automática** desde el pipeline (no hay `docker push` manual).

## Imágenes

| Imagen | Servicio | Lenguaje | Puerto | Base |
|---|---|---|---|---|
| `ghcr.io/<owner>/academix-api-gateway` | API Gateway REST → gRPC | TypeScript | 8080 | `node:22-alpine` |
| `ghcr.io/<owner>/academix-auth-service` | Autenticación | TypeScript | 50051 | `node:22-alpine` |
| `ghcr.io/<owner>/academix-talleres-service` | Talleres / catálogo | TypeScript | 50052 | `node:22-alpine` |
| `ghcr.io/<owner>/academix-reservas-service` | Reservas / ticketing | Go | 50053 | `distroless/static:nonroot` |
| `ghcr.io/<owner>/academix-certificados-service` | Certificados | Python | 50054 | `python:3.12-slim` |
| `ghcr.io/<owner>/academix-frontend` | Frontend (standalone, para compose/GKE) | TypeScript | 3000 | `node:22-alpine` |

`<owner>` es el usuario u organización de GitHub en minúsculas. Todas las imágenes son *multi-stage* y se ejecutan con usuario no-root.

Perfil del registro: `https://github.com/<owner>?tab=packages` → `[PEGAR AQUÍ el enlace real]`

## Hacer públicos los paquetes (para la calificación)

Por defecto GHCR crea los paquetes como privados. Para cada paquete: **Your profile → Packages → academix-… → Package settings → Change visibility → Public**. En la misma página, en *Manage Actions access*, confirmar que el repositorio tiene rol **Write**.

## Uso de las imágenes publicadas

```bash
export GHCR_OWNER=<owner> IMAGE_TAG=latest     # o develop / V1.0.0 / sha-xxxxxxx
docker compose -f docker-compose.yml -f docker-compose.registry.yml pull
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d --no-build
```

PowerShell:

```powershell
$env:GHCR_OWNER="<owner>"; $env:IMAGE_TAG="latest"
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d --no-build
```

## Evidencia

- Captura del perfil con los 6 paquetes: `[PEGAR AQUÍ]`
- Captura de las versiones/tags de un paquete (ej. `academix-reservas-service`): `[PEGAR AQUÍ]`
