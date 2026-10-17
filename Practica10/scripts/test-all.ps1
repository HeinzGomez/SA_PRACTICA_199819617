# HeinzGomez - Práctica 7: ejecuta todas las suites de pruebas unitarias (Windows PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\test-all.ps1 [-Solo frontend]
param([string]$Solo = "")
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
$fallidas = @()

function Paso([string]$cmd) {
  Write-Host "   > $cmd" -ForegroundColor DarkGray
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) { throw "El comando '$cmd' termino con codigo $LASTEXITCODE" }
}

function Suite([string]$nombre, [string]$dir, [string[]]$comandos) {
  if ($Solo -and $nombre -notlike "*$Solo*") { return }
  Write-Host "`n== $nombre" -ForegroundColor Cyan
  Push-Location (Join-Path $raiz $dir)
  try { foreach ($c in $comandos) { Paso $c } ; Write-Host "OK: $nombre" -ForegroundColor Green }
  catch { Write-Host "FALLO: $nombre -> $($_.Exception.Message)" -ForegroundColor Red; $script:fallidas += $nombre }
  finally { Pop-Location }
}

Suite "Go - reservas-service" "services/reservas-service" @("if not exist go.sum go mod tidy", "set GOMAXPROCS=1&& go test -p 1 -parallel 1 -count=1 -cover ./...")
foreach ($s in "auth-service", "talleres-service", "api-gateway") {
  Suite "Jest - $s" "services/$s" @("npm ci", "npm test")
}
Suite "pytest - certificados-service" "services/certificados-service" @(
  "python -m pip install -q -r requirements-dev.txt",
  "python -m pytest --cov=app --cov-report=term"
)
Suite "Jest - frontend" "frontend" @("npm ci", "npm test")

if ($fallidas.Count) {
  Write-Host "`nSuites con fallas: $($fallidas -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host "`nTodas las suites pasaron." -ForegroundColor Green
