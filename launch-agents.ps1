# AI Agents Launcher Script
# Use this script to quickly launch any agent

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("all", "openhands", "cline", "goose", "swe")]
    [string]$Agent,

    [string]$Port = "8000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AI Agents Orchestration Launcher   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

switch ($Agent) {
    "openhands" {
        Write-Host "Starting OpenHands Agent Canvas..." -ForegroundColor Green
        Write-Host "URL: http://localhost:$Port" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        agent-canvas --port $Port
    }
    "cline" {
        Write-Host "Starting Cline CLI..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        cline
    }
    "goose" {
        Write-Host "Starting Goose Session..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        goose session
    }
    "swe" {
        Write-Host "Starting mini-swe-agent..." -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        mini-swe-agent
    }
    "all" {
        Write-Host "Launching all agents in parallel..." -ForegroundColor Green
        Write-Host ""

        Write-Host "[1/3] Starting OpenHands Agent Canvas on port $Port..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-Command", "agent-canvas --port $Port"

        Start-Sleep -Seconds 2

        Write-Host "[2/3] Starting Goose..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-Command", "goose session"

        Start-Sleep -Seconds 2

        Write-Host "[3/3] Cline and mini-swe-agent ready for use" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "All agents launched!" -ForegroundColor Green
        Write-Host ""
        Write-Host "OpenHands Canvas: http://localhost:$Port" -ForegroundColor Yellow
        Write-Host "Cline: Run 'cline' in any terminal" -ForegroundColor Yellow
        Write-Host "Goose: Session running in separate window" -ForegroundColor Yellow
        Write-Host "mini-swe-agent: Run 'mini-swe-agent' in any terminal" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Cyan
    }
}
