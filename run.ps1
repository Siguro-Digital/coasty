# Coasty Automation Launcher for Windows PowerShell

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "🚀 Starting Coasty Automation..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Dependencies not installed. Running setup..." -ForegroundColor Yellow
    .\setup.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Setup failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
}

# Run the live automation script
npm run live

