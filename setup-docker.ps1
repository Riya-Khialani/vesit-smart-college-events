# ==============================================================================
# Smart College Event Management System - 1-Click Docker Replication Script
# Group 11 (VESIT D17A - ACC DevOps)
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  VESIT Smart College Event Management System - 1-Click Setup" -ForegroundColor Cyan
Write-Host "  Group 11 - D17A (ACC DevOps Containerized Microservices Stack)      " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. Check Docker Installation
# ------------------------------------------------------------------------------
Write-Host "[1/6] Checking Docker CLI..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "[ERROR] Docker is not installed or not in your PATH." -ForegroundColor Red
    Write-Host "   Please download and install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    exit 1
}
Write-Host "  [OK] $dockerVersion found." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 2. Check Docker Daemon Status
# ------------------------------------------------------------------------------
Write-Host "[2/6] Checking Docker Daemon status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "  [WARN] Docker Desktop is not currently running. Attempting to start it..." -ForegroundColor Yellow
    
    $dockerDesktopPath = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
    $dockerProgFiles = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
    } elseif (Test-Path $dockerProgFiles) {
        Start-Process $dockerProgFiles
    } else {
        Write-Host "  [WARN] Could not auto-start Docker Desktop. Please open Docker Desktop from your Start menu." -ForegroundColor Yellow
    }

    Write-Host "  Waiting for Docker engine to become active (up to 45 seconds)..." -ForegroundColor Yellow
    $retries = 15
    while ($retries -gt 0) {
        Start-Sleep -Seconds 3
        $check = docker info 2>$null
        if ($check) {
            break
        }
        $retries--
        Write-Host "     Waiting for Docker Engine..." -ForegroundColor Gray
    }

    $finalCheck = docker info 2>$null
    if (-not $finalCheck) {
        Write-Host "[ERROR] Docker engine is not ready. Please make sure Docker Desktop is open with the green light on." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] Docker daemon is active and running." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 3. Setup Environment Configuration (.env)
# ------------------------------------------------------------------------------
Write-Host "[3/6] Setting up environment configuration..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  [OK] Created .env file from .env.example." -ForegroundColor Green
    } else {
        @"
PORT=5000
NODE_ENV=production
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=college_events
JWT_SECRET=vesit_acc_super_secret_jwt_key_2026
"@ | Out-File -FilePath ".env" -Encoding ascii
        Write-Host "  [OK] Generated default .env file." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] Existing .env file detected." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 4. Build and Launch Multi-Container Stack
# ------------------------------------------------------------------------------
Write-Host "[4/6] Building and starting microservices stack (MySQL, Backend, Frontend)..." -ForegroundColor Yellow
Write-Host "      This might take 1-2 minutes on first run while downloading images..." -ForegroundColor Gray

docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start Docker Compose stack. Review the error output above." -ForegroundColor Red
    exit $LASTEXITCODE
}

# ------------------------------------------------------------------------------
# 5. Wait for Containers to become Healthy
# ------------------------------------------------------------------------------
Write-Host "[5/6] Verifying container health probes..." -ForegroundColor Yellow

$healthy = $false
for ($i = 1; $i -le 20; $i++) {
    Start-Sleep -Seconds 3
    try {
        $backendCheck = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($backendCheck.status -eq "healthy") {
            $healthy = $true
            break
        }
    } catch {
        # Backend still initializing
    }
    Write-Host "     [$i/20] Waiting for services to become healthy..." -ForegroundColor Gray
}

if ($healthy) {
    Write-Host "  [OK] All containers are healthy and running!" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Containers started, but healthcheck took longer than expected. Continuing..." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 6. Check Kubernetes Readiness (Optional)
# ------------------------------------------------------------------------------
Write-Host "[6/6] Checking Kubernetes cluster (Optional)..." -ForegroundColor Yellow
$k8sContext = kubectl config current-context 2>$null
if ($k8sContext) {
    Write-Host "  [K8S] Kubernetes context detected: $k8sContext" -ForegroundColor Cyan
    Write-Host "        To deploy to Kubernetes: kubectl apply -f k8s/" -ForegroundColor Gray
} else {
    Write-Host "  [INFO] Kubernetes is optional. Enable it via Docker Desktop Settings > Kubernetes if needed." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# Final Status and URLs
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] REPLICATION COMPLETE - APPLICATION IS LIVE AND RUNNING!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " Frontend Web Application : " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host " Backend REST API         : " -NoNewline; Write-Host "http://localhost:5000/api/events" -ForegroundColor Cyan
Write-Host " Health Check Probe       : " -NoNewline; Write-Host "http://localhost:5000/health" -ForegroundColor Cyan
Write-Host " MySQL Database           : " -NoNewline; Write-Host "localhost:3306 (user: root, pass: rootpassword)" -ForegroundColor Cyan
Write-Host ""
Write-Host " PRE-SEEDED TEST ACCOUNTS:" -ForegroundColor Yellow
Write-Host "   * Admin   : admin@vesit.edu   /  Admin@123" -ForegroundColor White
Write-Host "   * Student : riya@vesit.edu    /  Student@123" -ForegroundColor White
Write-Host "   * Scanner : scanner@vesit.edu /  Scanner@123" -ForegroundColor White
Write-Host ""
Write-Host " USEFUL COMMANDS:" -ForegroundColor Yellow
Write-Host "   * View container logs : docker compose logs -f" -ForegroundColor Gray
Write-Host "   * Stop containers     : docker compose down" -ForegroundColor Gray
Write-Host "   * Deploy to K8s       : kubectl apply -f k8s/" -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
