#!/usr/bin/env bash
# HeinzGomez - Práctica 7: ejecuta todas las suites de pruebas unitarias
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Go · reservas-service"
(cd "$RAIZ/services/reservas-service" && { [ -f go.sum ] || go mod tidy; } && go test -race -cover ./...)

for s in auth-service talleres-service api-gateway; do
  echo "== Jest · $s"
  (cd "$RAIZ/services/$s" && npm ci --silent && npm test -- --silent)
done

echo "== pytest · certificados-service"
(cd "$RAIZ/services/certificados-service" && python -m pip install -q -r requirements-dev.txt && python -m pytest --cov=app)

echo "== Jest · frontend"
(cd "$RAIZ/frontend" && npm ci --silent && npm test -- --silent)

echo "Todas las suites pasaron."
