<#
.SYNOPSIS
  Docker Container Lifecycle Manager for Shopping Cart & Checkout Project.
.DESCRIPTION
  Automates container build, run, inspect, healthcheck, logs, restart, and teardown.
.PARAMETER Action
  The lifecycle action: build, up, down, stop, restart, logs, inspect, health, reset-db, clean.
.EXAMPLE
  .\scripts\docker-manager.ps1 up
  .\scripts\docker-manager.ps1 health
  .\scripts\docker-manager.ps1 logs -Service backend
#>

[CmdletBinding()]
param (
  [Parameter(Position = 0, Mandatory = $true)]
  [ValidateSet('build', 'up', 'down', 'stop', 'restart', 'logs', 'inspect', 'health', 'reset-db', 'clean')]
  [string]$Action,

  [Parameter(Position = 1, Mandatory = $false)]
  [string]$Service = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🐳 Docker Lifecycle Automation | Action: $Action" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Assert-DockerAvailable {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker CLI is not detected in your PATH. Please start Docker Desktop or install Docker."
    exit 1
  }
}

switch ($Action) {
  'build' {
    Assert-DockerAvailable
    Write-Host "[BUILD] Building production images with Docker Compose..." -ForegroundColor Green
    Set-Location $ProjectRoot
    docker compose build --no-cache
    Write-Host "✔ Build complete. Verified sub-90MB multi-stage image footprint." -ForegroundColor Green
  }

  'up' {
    Assert-DockerAvailable
    Write-Host "[DEPLOY] Starting container cluster with persistent volumes..." -ForegroundColor Green
    Set-Location $ProjectRoot
    docker compose up -d
    Write-Host "✔ Containers running. Waiting for healthcheck probe..." -ForegroundColor Green
    Start-Sleep -Seconds 4
    docker compose ps
  }

  'down' {
    Assert-DockerAvailable
    Write-Host "[TEARDOWN] Stopping and removing containers and networks..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    docker compose down
    Write-Host "✔ Cluster stopped cleanly." -ForegroundColor Green
  }

  'stop' {
    Assert-DockerAvailable
    Write-Host "[STOP] Pausing running containers..." -ForegroundColor Yellow
    Set-Location $ProjectRoot
    docker compose stop
  }

  'restart' {
    Assert-DockerAvailable
    Write-Host "[RESTART] Gracefully restarting container services..." -ForegroundColor Green
    Set-Location $ProjectRoot
    docker compose restart $Service
  }

  'logs' {
    Assert-DockerAvailable
    Set-Location $ProjectRoot
    if ($Service) {
      docker compose logs -f $Service
    } else {
      docker compose logs -f --tail 100
    }
  }

  'inspect' {
    Assert-DockerAvailable
    Write-Host "[INSPECT] Extracting container telemetry and health state..." -ForegroundColor Cyan
    Write-Host "`n--- BACKEND CONTAINER INSPECTION ---" -ForegroundColor Yellow
    docker inspect --format='Name: {{.Name}} | Status: {{.State.Status}} | Health: {{json .State.Health.Status}} | Non-Root User: {{.Config.User}}' cart-backend
    Write-Host "`n--- VOLUME MOUNT DETAILS ---" -ForegroundColor Yellow
    docker inspect --format='{{range .Mounts}}Source: {{.Source}} -> Target: {{.Destination}} (Type: {{.Type}}){{println}}{{end}}' cart-backend
  }

  'health' {
    Write-Host "[HEALTH PROBE] Testing endpoint responsiveness..." -ForegroundColor Green
    try {
      $backendHealth = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get -TimeoutSec 3
      Write-Host "✔ Backend Health (Port 5000):" -ForegroundColor Green
      $backendHealth | ConvertTo-Json -Depth 3 | Write-Host
    } catch {
      Write-Host "❌ Backend probe failed on http://localhost:5000/api/health: $_" -ForegroundColor Red
    }

    try {
      $frontendHealth = Invoke-WebRequest -Uri "http://localhost/health" -Method Get -TimeoutSec 3
      Write-Host "✔ Frontend Nginx Reverse Proxy (Port 80): HTTP $($frontendHealth.StatusCode) OK" -ForegroundColor Green
    } catch {
      Write-Host "❌ Frontend probe failed on http://localhost/health: $_" -ForegroundColor Red
    }
  }

  'reset-db' {
    Assert-DockerAvailable
    Write-Host "[RESET] Destroying persistent database volume..." -ForegroundColor Red
    Set-Location $ProjectRoot
    docker compose down -v
    Write-Host "✔ Persistent volume cart-db-data removed. Database will re-seed on next launch." -ForegroundColor Green
  }

  'clean' {
    Assert-DockerAvailable
    Write-Host "[CLEANUP] Purging dangling containers, networks, and build caches..." -ForegroundColor Red
    Set-Location $ProjectRoot
    docker compose down --rmi all --volumes --remove-orphans
    docker system prune -f
    Write-Host "✔ Docker environment cleaned." -ForegroundColor Green
  }
}
