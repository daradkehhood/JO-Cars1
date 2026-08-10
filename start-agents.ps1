# ============================================
#  AI Agents Master Launcher
#  NVIDIA API Configured
# ============================================

# Set environment variables for this session
$env:NVIDIA_API_KEY = "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"
$env:OPENAI_API_KEY = "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"
$env:OPENAI_API_BASE = "https://integrate.api.nvidia.com/v1"
$env:OPENAI_MODEL = "openai/gpt-oss-120b"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   AI Agents - NVIDIA API Configured" -ForegroundColor Cyan
Write-Host "   Model: openai/gpt-oss-120b" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose an agent to launch:" -ForegroundColor White
Write-Host ""
Write-Host "  [1] OpenHands Agent Canvas (Web GUI)" -ForegroundColor Green
Write-Host "      → http://localhost:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] Cline CLI (Terminal Agent)" -ForegroundColor Green
Write-Host "      → Quick coding in terminal" -ForegroundColor Gray
Write-Host ""
Write-Host "  [3] Goose Session (Multi-Tool Agent)" -ForegroundColor Green
Write-Host "      → Extensions & integrations" -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] mini-swe-agent (GitHub Issue Solver)" -ForegroundColor Green
Write-Host "      → Automated bug fixes" -ForegroundColor Gray
Write-Host ""
Write-Host "  [5] Launch ALL agents" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [Q] Quit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Enter your choice (1-5 or Q)"

switch ($choice) {
    "1" {
        Write-Host "`nStarting OpenHands Agent Canvas..." -ForegroundColor Green
        Write-Host "Open http://localhost:8000 in your browser" -ForegroundColor Yellow
        agent-canvas
    }
    "2" {
        Write-Host "`nStarting Cline CLI..." -ForegroundColor Green
        cline
    }
    "3" {
        Write-Host "`nStarting Goose Session..." -ForegroundColor Green
        goose session
    }
    "4" {
        Write-Host "`nStarting mini-swe-agent..." -ForegroundColor Green
        mini-swe-agent
    }
    "5" {
        Write-Host "`nLaunching all agents..." -ForegroundColor Yellow

        # Launch OpenHands in background
        Write-Host "[1/4] Starting OpenHands on http://localhost:8000..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-Command", "agent-canvas" -WindowStyle Minimized
        Start-Sleep -Seconds 3

        # Launch Goose in background
        Write-Host "[2/4] Starting Goose..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-Command", "goose session" -WindowStyle Minimized
        Start-Sleep -Seconds 2

        # Launch Cline
        Write-Host "[3/4] Starting Cline..." -ForegroundColor Green

        # Launch mini-swe-agent
        Write-Host "[4/4] mini-swe-agent ready" -ForegroundColor Green

        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "   All Agents Launched!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "OpenHands Canvas: http://localhost:8000" -ForegroundColor Yellow
        Write-Host "Cline: Type 'cline' in any terminal" -ForegroundColor Yellow
        Write-Host "Goose: Running in background" -ForegroundColor Yellow
        Write-Host "mini-swe-agent: Type 'mini-swe-agent' in any terminal" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "All agents configured with NVIDIA API" -ForegroundColor Green
        Write-Host "Model: openai/gpt-oss-120b" -ForegroundColor Yellow
        Write-Host ""

        # Now start Cline interactively
        Write-Host "Starting Cline interactive session..." -ForegroundColor Green
        cline
    }
    "Q" {
        Write-Host "Goodbye!" -ForegroundColor Red
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}
