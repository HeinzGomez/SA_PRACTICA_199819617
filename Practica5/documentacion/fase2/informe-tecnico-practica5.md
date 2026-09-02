# Informe Técnico — Práctica 5

**Cuaderno de Apuntes Markdown, Container Registry y Pipeline CI Automatizado**
Plataforma **YoUSAC / Quetxal TV** — Proyecto Fase 2.

> Responsable de los entregables 4–8 (CI/CD, Registry, pruebas, informe e historial): **Heinz Gómez**.
> Los entregables 1–3 (Cuaderno de Apuntes Markdown) corresponden al otro integrante del equipo.

---

## Índice

- [1. Introducción](#1-introducción)
- [2. Pipeline de Integración Continua (CI)](#2-pipeline-de-integración-continua-ci)
- [3. Container Registry (GHCR)](#3-container-registry-ghcr)
- [4. Suites de Pruebas Unitarias](#4-suites-de-pruebas-unitarias)
- [5. Cuaderno de Apuntes (evidencia funcional)](#5-cuaderno-de-apuntes-evidencia-funcional)
- [6. Historial de Git y Pull Requests](#6-historial-de-git-y-pull-requests)
- [7. Conclusiones](#7-conclusiones)

---

## 1. Introducción

Este informe documenta la automatización del ciclo de integración continua de la plataforma. Se implementó un **pipeline de CI en GitHub Actions** que, ante cada Pull Request o push, ejecuta las **suites de pruebas unitarias** de los microservicios y, únicamente si todas pasan, **construye y publica las imágenes Docker** en el **Container Registry de GitHub (GHCR)** con etiquetas de versionamiento semántico. La publicación manual queda prohibida: el 100% de las imágenes las sube el pipeline.

---

## 2. Pipeline de Integración Continua (CI)

**Archivo:** `.github/workflows/ci.yml`

### 2.1 Estructura (jobs)

| Job | Qué hace |
|-----|----------|
| `test-go` | Instala `protoc` + plugins, **genera los stubs gRPC** y ejecuta `go test ./...` en `grabaciones`, `recursos` e `historial`. |
| `test-node` | Ejecuta `npm test` en `autenticacion`, `inscripcion` y `api-gateway` **solo si el servicio define un script de pruebas**. |
| `test-python` | Ejecuta `pytest` en `analisis` y `notificaciones` **solo si existen archivos de prueba**. |
| `build-and-push` | Construye y publica las 9 imágenes en GHCR. **`needs: [test-go, test-node, test-python]`**. |

### 2.2 Cortocircuito ante fallos

El job `build-and-push` declara `needs` sobre los tres jobs de prueba. Si **cualquier** prueba falla, GitHub Actions **no ejecuta** `build-and-push`, por lo que **ninguna imagen se publica** en el Registry. Esto cumple el requisito de cortocircuitar la subida ante pruebas fallidas.

### 2.3 Disparadores

- `pull_request`: corre las pruebas en cada PR (evidencia de CI en verde antes de integrar).
- `push` a `develop` / `main` y `tags` `V*`/`v*`: corre pruebas y, si pasan, publica imágenes.
- `workflow_dispatch`: ejecución manual desde la pestaña *Actions*.

### 2.4 Requisito de configuración (una sola vez)

Para que el `GITHUB_TOKEN` pueda publicar en GHCR:
**Settings → Actions → General → Workflow permissions → “Read and write permissions”**.

### 2.5 Evidencia de ejecución

- Badge del workflow:
  `![CI](https://github.com/RamiroTelles/SA_PROYECTO_202010044/actions/workflows/ci.yml/badge.svg)`
- Historial de ejecuciones: pestaña **Actions** del repositorio.

> **[PEGAR AQUÍ]** captura(s) del pipeline en verde (jobs `test-*` y `build-and-push` completados).

---

## 3. Container Registry (GHCR)

Las imágenes se publican en `ghcr.io/<owner>/<imagen>` con etiquetas generadas automáticamente por `docker/metadata-action` (nombre de rama, tag de release, versión semántica, short-SHA y `latest` en la rama por defecto).

### 3.1 Imágenes publicadas

| Servicio | Imagen |
|----------|--------|
| Autenticación | `ghcr.io/<owner>/yousac-auth` |
| Inscripción | `ghcr.io/<owner>/yousac-ins` |
| Grabaciones | `ghcr.io/<owner>/yousac-grab` |
| Analítica | `ghcr.io/<owner>/yousac-anal` |
| Historial | `ghcr.io/<owner>/yousac-history` |
| Notificaciones | `ghcr.io/<owner>/yousac-notification` |
| Recursos (apuntes/materiales) | `ghcr.io/<owner>/yousac-resource` |
| API Gateway | `ghcr.io/<owner>/yousac-api-gateway` |
| Frontend | `ghcr.io/<owner>/yousac-frontend` |

### 3.2 Perfil / enlace del Registry

- Paquetes del repositorio: pestaña **Packages** del repositorio en GitHub.
- Perfil del owner: `https://github.com/<owner>?tab=packages`

> **[PEGAR AQUÍ]** enlace público al Registry y captura de la lista de imágenes versionadas.

### 3.3 Ejemplo de consumo

```bash
docker pull ghcr.io/<owner>/yousac-grab:V1.2.0
```

---

## 4. Suites de Pruebas Unitarias

Las pruebas se ejecutan automáticamente en el job `test-go`. Resultados verificados:

**Servicio Grabaciones — módulo de capítulos** (`servicio-grabaciones/services`):

```
ok  servicio-grabaciones/services   (PASS: 11 casos)
```

Cobertura: validación de rangos de marcas de tiempo, creación válida, clase inexistente, marca fuera de rango, marca duplicada, edición inexistente e id de clase inválido.

**Servicio Recursos — apuntes y materiales** (`servicio_recursos/...`):

```
ok  servicio_recursos/repositories
ok  servicio_recursos/services
ok  servicio_recursos/types
ok  servicio_recursos/controller   (en CI, con stubs gRPC regenerados)
```

> El job `test-go` regenera los stubs gRPC con `protoc` antes de `go test`, por lo que todos los paquetes (incluidos los controladores gRPC) compilan y se prueban en el pipeline.

> **[PEGAR AQUÍ]** captura del job `test-go` en verde en Actions.

---

## 5. Cuaderno de Apuntes (evidencia funcional)

> Módulo desarrollado por el otro integrante (entregables 1–3). Se evalúa en local con `docker-compose.dev.yml`.

> **[PEGAR AQUÍ]** capturas del cuaderno de apuntes funcionando: editor Markdown, atajo `[MM:SS]`, salto en el reproductor y exportación PDF/.md.

---

## 6. Historial de Git y Pull Requests

- Ramas de trabajo del módulo de capítulos (integrante Heinz Gómez): `feat/segmentacion-capitulos`, `feat/segmentacion-capitulos-frontend`, `feat/documentacion-capitulos`, `feat/ci-cd-registry`.
- Flujo: rama `feat/*` → Pull Request → `develop` → Pull Request → `main` (ramas protegidas).
- **Tag de versión:** `V1.2.0`.

> **[PEGAR AQUÍ]** enlaces a los Pull Requests aprobados de esta práctica.

---

## 7. Conclusiones

- El pipeline de CI automatiza la verificación de calidad: cada cambio ejecuta las pruebas unitarias y, solo ante un resultado exitoso, promueve las imágenes al Registry, eliminando la subida manual y garantizando trazabilidad.
- El uso de GHCR con el `GITHUB_TOKEN` integrado simplifica la autenticación y el versionamiento semántico de las 9 imágenes de la plataforma.
- La estrategia de *jobs* con `needs` implementa el cortocircuito exigido: un fallo en pruebas detiene la publicación, protegiendo la integridad del Registry.
