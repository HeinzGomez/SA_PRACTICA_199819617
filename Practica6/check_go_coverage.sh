#!/bin/bash
# Script: check_go_coverage.sh
# Verifica que el coverage total de un servicio Go sea >= 75%
# Excluye paquetes auto-generados (proto/, grpc/)
# Uso: ./check_go_coverage.sh <directorio_del_servicio>
# Ejemplo: ./check_go_coverage.sh servicios/grabaciones/src

set -e

if [ -z "$1" ]; then
    echo "Uso: $0 <directorio_del_servicio>"
    exit 1
fi

SERVICE_DIR="$1"
THRESHOLD=75

if [ ! -d "$SERVICE_DIR" ]; then
    echo "Error: Directorio '$SERVICE_DIR' no existe"
    exit 1
fi

cd "$SERVICE_DIR"

echo "=== Cobertura por paquete ==="
go test ./... -coverprofile=coverage_raw.out -v 2>&1

echo ""
echo "=== Cobertura total (excluyendo proto/grpc) ==="
grep -v '/proto/' coverage_raw.out | grep -v '/grpc/' > coverage.out

TOTAL=$(go tool cover -func=coverage.out | tail -1 | awk '{print $3}' | tr -d '%')

echo "Cobertura total: ${TOTAL}%"

if [ $(echo "$TOTAL < $THRESHOLD" | bc -l) -eq 1 ]; then
    echo "Error: Cobertura ${TOTAL}% es menor al ${THRESHOLD}% requerido"
    rm -f coverage_raw.out coverage.out
    exit 1
fi

echo "OK: Cobertura ${TOTAL}% >= ${THRESHOLD}%"
rm -f coverage_raw.out coverage.out
exit 0
