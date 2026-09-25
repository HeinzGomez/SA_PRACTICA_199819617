# Entregable 4 — Pipeline de Integración Continua (GitHub Actions)

<!-- HeinzGomez - Práctica 7: documentación del pipeline de CI -->

Archivo: [`.github/workflows/ci-practica7.yml`](../../.github/workflows/ci-practica7.yml) en la **raíz** del repositorio `SA_PRACTICA_199819617` (GitHub solo ejecuta workflows ubicados ahí), validado con `actionlint`.

Como el repositorio contiene todas las prácticas, las rutas llevan el prefijo `Practica7/` y el workflow tiene filtro `paths`: solo se ejecuta cuando cambia algo dentro de `Practica7/` o el propio workflow (los tags `V*` siempre lo disparan).

## Disparadores

| Evento | Qué hace |
|---|---|
| `pull_request` a `develop` o `main` | Pruebas + build de las 6 imágenes **sin publicar** (valida los Dockerfile antes de aprobar el PR) |
| `push` a `develop` o `main` | Pruebas + build + **push a GHCR** |
| `push` de tag `v*.*.*` / `V*.*.*` (p. ej. `V1.0.0`) | Pruebas + build + push con el tag de versión |
| `push` a `feature/**`, `feat/**` | Solo pruebas y build (sin push) |
| `workflow_dispatch` | Ejecución manual |

`concurrency` cancela ejecuciones anteriores de la misma rama.

## Etapas

```
 test-go ──────────┐
 test-node (x3) ───┤
 test-python ──────┼──► build-and-push (x6 imágenes, matriz)
 test-frontend ────┘         needs: todas las pruebas  ⇒ si una falla, no se publica nada
```

| Job | Herramientas | Detalle |
|---|---|---|
| `test-go` | Go 1.24, service container **Redis 7** | `go vet`, `go test -race` con cobertura; la prueba del script Lua corre contra Redis real (`REDIS_ADDR`) |
| `test-node` | Node 22, matriz `auth-service`, `talleres-service`, `api-gateway` | `npm ci`, compilación `tsc`, Jest con cobertura |
| `test-python` | Python 3.12 | Compila **todos** los `.proto` (valida contratos), genera stubs, `pytest --cov` + reporte JUnit |
| `test-frontend` | Node 22 | Verificación de tipos, Jest, `next build` (el mismo build que ejecuta Vercel) |
| `build-and-push` | Buildx, `docker/metadata-action`, `docker/build-push-action` | Contexto = raíz del repo, caché `type=gha` por imagen, login a `ghcr.io` con `GITHUB_TOKEN` |

Cada job sube su cobertura como *artifact* (`cobertura-go`, `cobertura-auth-service`, …) y el resumen de la ejecución lista los tags publicados.

## Tags de imagen

| Situación | Tags |
|---|---|
| push a `develop` | `develop`, `sha-<7>` |
| push a `main` | `main`, `sha-<7>`, `latest` |
| tag `V1.0.0` | `V1.0.0`, `sha-<7>` (con un tag `v1.0.0` en minúscula se agregan además `1.0.0` y `1.0`) |
| PR #12 | `pr-12` (solo build) |

## Configuración requerida en GitHub (una sola vez)

1. **Settings → Actions → General → Workflow permissions → Read and write permissions** (permite que `GITHUB_TOKEN` publique paquetes).
2. Proteger `main` y `develop` (Settings → Branches) exigiendo que los checks del workflow **CI - Practica 7 Academix Pass** pase antes de fusionar un PR.
3. Tras la primera publicación, hacer públicos los paquetes (ver entregable 5).

## Evidencia

- Ejecución exitosa del pipeline: 
  - Develop: 
    - [![Actions-en-verde-Develop.jpg](https://i.postimg.cc/QMcdcFR5/Actions-en-verde-Develop.jpg)](https://postimg.cc/qtMrTvBM)
  - Main:
    - [![Actions-en-verde-Main.jpg](https://i.postimg.cc/QMgjHRTk/Actions-en-verde-Main.jpg)](https://postimg.cc/p9dwSckp)
