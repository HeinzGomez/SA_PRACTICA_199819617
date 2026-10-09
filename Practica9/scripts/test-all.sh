#!/usr/bin/env bash
# HeinzGomez - Práctica 7: ejecuta todas las suites de pruebas unitarias
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"

echo "== Go · reservas-service"
# -race necesita ~2GB de RAM y reproducimos el paralelismo de una máquina pequeña:
# GOMAXPROCS=1 -p 1 -parallel 1 mantienen el consumo bajo sin perder cobertura.
(cd "$RAIZ/services/reservas-service" && { [ -f go.sum ] || go mod tidy; } \
  && GOMAXPROCS=1 go test -p 1 -parallel 1 -count=1 -cover ./...)

for s in auth-service talleres-service api-gateway; do
  echo "== Jest · $s"
  (cd "$RAIZ/services/$s" && npm ci --silent && npm test -- --silent)
done

echo "== pytest · certificados-service"
# Un solo proceso (sin pytest-xdist) y reporte solo en terminal: la suite vive
# en ~50 MB de RAM. El mínimo del 70 % por ramas está en .coveragerc.
(cd "$RAIZ/services/certificados-service" && python -m pip install -q -r requirements-dev.txt \
  && python -m pytest --cov=app --cov-report=term)

echo "== Jest · frontend"
(cd "$RAIZ/frontend" && npm ci --silent && npm test -- --silent)

echo "Todas las suites pasaron."
